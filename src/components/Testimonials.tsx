import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, TrendingUp, Loader, ChevronDown } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const shimmerBase = "bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted/50 via-[50%] to-muted animate-shimmer";

// Modern loader component
const TestimonialsLoader = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <style>{`
      @keyframes pulseScale {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 1; }
      }
      @keyframes rotateSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .pulse-scale {
        animation: pulseScale 2s ease-in-out infinite;
      }
    `}</style>
    
    

    <div className="flex items-center gap-2 mb-6 text-accent">
      <Loader className="h-4 w-4 animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">Loading</p>
    </div>
  </div>
);

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

const TestimonialsHeading = ({ average }: { average?: number }) => (
  <div className="text-center mb-12 sm:mb-20">
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 bg-clip-text animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
     Testimonials
    </h2>
    <p className="hidden sm:block text-lg text-muted-foreground max-w-3xl mx-auto mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
     Read what clients say about us
    </p>

    {average !== undefined && (
      <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-border/60 bg-background/70 px-5 py-2 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <div className="flex gap-0.5" aria-label={`Average rating ${average.toFixed(1)} out of 5`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(average) ? "fill-accent text-accent" : "text-muted-foreground/25"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {average.toFixed(1)}
        </span>
      </div>
    )}
  </div>
);

const SkeletonGrid = () => (
  <div className="space-y-8 sm:space-y-12">
    <TestimonialsLoader />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 sm:mb-20" aria-hidden="true">
      <SkeletonCard delay={0} />
      <SkeletonCard delay={150} />
      <SkeletonCard delay={300} />
    </div>
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

  const average = useMemo(() => {
    if (sortedTestimonials.length === 0) return undefined;
    return (
      sortedTestimonials.reduce((sum, t) => sum + t.rating, 0) /
      sortedTestimonials.length
    );
  }, [sortedTestimonials]);

  return (
    <div className="container mx-auto px-4 lg:px-6">
      <TestimonialsHeading average={average} />

      {loading && <SkeletonGrid />}

      {showEmpty && (
        <div className="text-center py-16 animate-in fade-in duration-500">
          <Quote className="w-12 h-12 text-accent/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No reviews yet </p>
        </div>
      )}

      {sortedTestimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 sm:mb-20">
          {sortedTestimonials.map((testimonial, idx) => (
            <div
              key={testimonial._id}
              className="group"
              style={{
                animation: `fadeInUp 0.6s ease-out forwards`,
                animationDelay: `${idx * 100}ms`,
                opacity: 0,
              }}
            >
              <style>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <Card className="relative overflow-hidden border-border h-full hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 bg-gradient-to-br from-muted/30 to-background">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] via-transparent to-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="relative p-5 sm:p-6 lg:p-7 flex flex-col h-full">
                  {/* Top row: Avatar + Name (left), Event type (center), Rating tile (right) */}
                  <div className="flex items-center justify-between gap-3 mb-4 z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0 ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all duration-300">
                        <span className="text-xs font-bold text-accent">
                          {testimonial.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm truncate group-hover:text-accent transition-colors duration-300">
                        {testimonial.name}
                      </p>
                    </div>

                    <span className="text-[11px] font-medium text-muted-foreground/70 text-center flex-shrink-0">
                      {testimonial.event}
                    </span>

                    <div className="inline-flex items-center gap-0.5 flex-shrink-0 rounded-full bg-accent/10 px-2.5 py-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < testimonial.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Rounded review span */}
                  <div className="flex-grow rounded-2xl border border-border/40 bg-background/60 p-4 sm:p-5 shadow-sm group-hover:shadow-accent/10 transition-shadow duration-300">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line break-words line-clamp-5">
                      &quot;{testimonial.content}&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-8 pt-4">
        {/* White glass "Submit a review" tab toggles the pull-down form */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className={`group relative inline-flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 px-8 sm:px-10 py-4 text-foreground font-semibold shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 hover:bg-white active:scale-[0.97] transition-all duration-300 text-sm sm:text-base ${
              showForm ? "bg-white shadow-none" : ""
            }`}
            aria-label="Submit a review"
            aria-expanded={showForm}
          >
            Submit a review

            {/* Pull-down chevron */}
            <ChevronDown
              className={`w-5 h-5 text-accent transition-all duration-300 ${
                showForm ? "rotate-180" : "group-hover:translate-y-0.5"
              }`}
            />
          </button>

          <span className="text-xs text-muted-foreground/70">
            {showForm ? "Click to hide the form" : "Click to open the review form"}
          </span>
        </div>

        {/* Pull-down review form */}
        <div
          className={`w-full max-w-2xl transition-all duration-500 ease-in-out overflow-hidden ${
            showForm ? "max-h-[1200px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
          }`}
        >
          <div className="relative rounded-3xl border border-white/30 bg-white/60 backdrop-blur-2xl shadow-2xl shadow-black/10 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-b-full bg-gradient-to-r from-accent to-amber-500" />
            <div className="mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Share your experience
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                We'd love to hear your feedback to help us improve.
              </p>
            </div>

            <div className="w-full">
              <ReviewForm onSuccess={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      </div>
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
    <section ref={sectionRef} id="testimonials" className="section-mobile-padding bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-40 pointer-events-none" />
      
      <div className="relative z-10">
        {shouldLoad ? <TestimonialsContent /> : <TestimonialsHeadingPlaceholder />}
      </div>
    </section>
  );
};

const TestimonialsHeadingPlaceholder = () => (
  <div className="container mx-auto px-4 lg:px-6">
    <TestimonialsHeading />
    <SkeletonGrid />
  </div>
);
