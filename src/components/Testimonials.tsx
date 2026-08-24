import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const shimmerBase = "bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted/50 via-[50%] to-muted animate-shimmer";

const SkeletonCard = ({ delay }: { delay: number }) => (
  <Card className="border-border" style={{ animationDelay: `${delay}ms` }}>
    <CardContent className="p-4 sm:p-6 lg:p-8">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-full ${shimmerBase}`} />
        ))}
      </div>
      <div className="space-y-2 mb-4 sm:mb-6">
        <div className={`h-4 rounded w-full ${shimmerBase}`} />
        <div className={`h-4 rounded w-5/6 ${shimmerBase}`} />
        <div className={`h-4 rounded w-4/6 ${shimmerBase}`} />
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
        <div className={`w-9 h-9 rounded-full flex-shrink-0 ${shimmerBase}`} />
        <div className="space-y-1.5">
          <div className={`h-3.5 rounded w-24 ${shimmerBase}`} />
          <div className={`h-3 rounded w-32 ${shimmerBase}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const TestimonialsHeading = () => (
  <div className="text-center mb-10 sm:mb-16">
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
      What Our Clients Say
    </h2>
    <p className="hidden sm:block text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
      Don't just take our word for it - hear from our satisfied clients
    </p>
    <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto mb-5">
      Hear from our satisfied clients.
    </p>
  </div>
);

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16" aria-hidden="true">
    <SkeletonCard delay={0} />
    <SkeletonCard delay={150} />
    <SkeletonCard delay={300} />
  </div>
);

const TestimonialsContent = () => {
  const [showForm, setShowForm] = useState(false);
  const reviews = useQuery(api.reviews.getApprovedReviews);

  const sortedTestimonials = useMemo(
    () => (reviews ?? []).slice().sort((a, b) => b.createdAt - a.createdAt),
    [reviews]
  );

  const loading = reviews === undefined;
  const showEmpty = !loading && sortedTestimonials.length === 0;

  return (
    <div className="container mx-auto px-4 lg:px-6">
      <TestimonialsHeading />

      {loading && <SkeletonGrid />}

      {showEmpty && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

        {sortedTestimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16">
            {sortedTestimonials.map((testimonial) => (
              <Card key={testimonial._id} className="group relative overflow-hidden border-border hover:shadow-lg transition-shadow duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/[0.03] rounded-bl-[80px]" />
                <CardContent className="relative p-4 sm:p-6 lg:p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <div className="relative mb-4 sm:mb-6">
                    <span className="absolute -top-2 -left-1 text-5xl text-accent/10 font-serif select-none leading-none">&ldquo;</span>
                    <p className="text-sm sm:text-base text-foreground pl-5 italic whitespace-pre-line break-words">
                      {testimonial.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-accent">
                        {testimonial.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.event} &middot; {new Date(testimonial.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 active:bg-accent active:scale-95 transition-all"
          >
            {showForm ? "Hide Review Form" : "Share Your Experience"}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 sm:mt-10 mb-16">
            <ReviewForm />
          </div>
        )}
    </div>
  );
};

const LAZY_ROOT_MARGIN = "600px 0px";

export const Testimonials = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || shouldLoad) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: LAZY_ROOT_MARGIN }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <section ref={sectionRef} id="testimonials" className="section-mobile-padding bg-background">
      {shouldLoad ? <TestimonialsContent /> : <TestimonialsHeadingPlaceholder />}
    </section>
  );
};

const TestimonialsHeadingPlaceholder = () => (
  <div className="container mx-auto px-4 lg:px-6">
    <TestimonialsHeading />
    <SkeletonGrid />
  </div>
);
