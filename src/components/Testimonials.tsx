import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, TrendingUp, Loader, X } from "lucide-react";
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
      @keyframes dotBounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
        40% { transform: translateY(-10px); opacity: 1; }
      }
      .loader-spin {
        animation: rotateSpin 2.5s linear infinite;
      }
      .pulse-scale {
        animation: pulseScale 2s ease-in-out infinite;
      }
      .dot-bounce {
        animation: dotBounce 1.4s ease-in-out infinite;
      }
    `}</style>
    
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
      <div className="relative w-16 h-16 flex items-center justify-center">
        <Loader className="w-8 h-8 text-accent loader-spin" />
      </div>
    </div>

    <div className="flex gap-1 mb-6 h-2">
      <div className="w-2 h-2 rounded-full bg-accent dot-bounce" style={{ animationDelay: "0s" }} />
      <div className="w-2 h-2 rounded-full bg-accent dot-bounce" style={{ animationDelay: "0.3s" }} />
      <div className="w-2 h-2 rounded-full bg-accent dot-bounce" style={{ animationDelay: "0.6s" }} />
    </div>

    <p className="text-sm text-muted-foreground font-medium">Loading amazing testimonials...</p>
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

const TestimonialsHeading = () => (
  <div className="text-center mb-12 sm:mb-20">
    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TrendingUp className="w-4 h-4 text-accent" />
      <span className="text-xs sm:text-sm font-semibold text-accent">Trusted by Events Across Ghana</span>
    </div>
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 bg-clip-text animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      What clients say about us
    </h2>
    <p className="hidden sm:block text-lg text-muted-foreground max-w-3xl mx-auto mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      Real experiences from real events. See how we've transformed celebrations
    </p>
    <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      Real experiences from real events.
    </p>
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

  return (
    <div className="container mx-auto px-4 lg:px-6">
      <TestimonialsHeading />

      {loading && <SkeletonGrid />}

      {showEmpty && (
        <div className="text-center py-16 animate-in fade-in duration-500">
          <Quote className="w-12 h-12 text-accent/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No reviews yet. Be the first to share your experience!</p>
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
                
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-[100px] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Quote icon */}
                <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <Quote className="w-16 h-16 text-accent" />
                </div>

                <CardContent className="relative p-6 sm:p-7 lg:p-8 flex flex-col h-full">
                  {/* Rating stars */}
                  <div className="flex gap-1.5 mb-5 z-10">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="relative">
                        <Star
                          className={`w-5 h-5 transition-all duration-300 ${
                            i < testimonial.rating
                              ? 'fill-accent text-accent scale-110'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Testimonial text */}
                  <div className="relative mb-6 sm:mb-8 flex-grow">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line break-words line-clamp-5">
                      &quot;{testimonial.content}&quot;
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 mb-4 sm:mb-5" />

                  {/* Author info */}
                  <div className="flex items-center gap-3 z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center flex-shrink-0 ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all duration-300">
                      <span className="text-sm font-bold text-accent">
                        {testimonial.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate group-hover:text-accent transition-colors duration-300">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {testimonial.event} • {new Date(testimonial.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {testimonial.rating === 5 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-600">Perfect</span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">
            Had a wonderful experience with us?
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-500 px-8 py-3 text-white font-semibold hover:shadow-lg hover:shadow-accent/40 active:scale-95 transition-all duration-300 text-sm sm:text-base"
          >
            <Star className="w-4 h-4" />
            Share Your Experience
          </button>
        </div>

      </div>

      {/* Glass Effect Modal */}
      {showForm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={() => setShowForm(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Share your experience form"
          >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md shadow-2xl shadow-black/20 p-6 sm:p-8 lg:p-10 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full p-2 text-muted-foreground hover:bg-white/20 hover:text-foreground transition-all duration-300 z-10"
              aria-label="Close form"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Header */}
            <div className="mb-6 sm:mb-8 pr-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Share Your Experience
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                We'd love to hear about your event! Your feedback helps us improve.
              </p>
            </div>

            {/* Form Container */}
            <div className="w-full">
              <ReviewForm onSuccess={() => setShowForm(false)} />
            </div>
          </div>
          </div>,
          document.body,
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
