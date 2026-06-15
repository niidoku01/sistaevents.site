import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { reviewAPI } from "@/lib/api";

type Review = {
  _id: string;
  name: string;
  email: string;
  event: string;
  content: string;
  rating: number;
  createdAt: number;
};

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
      <div className="space-y-1.5">
        <div className={`h-4 rounded w-1/3 ${shimmerBase}`} />
        <div className={`h-3 rounded w-1/4 ${shimmerBase}`} />
        <div className={`h-3 rounded w-1/5 ${shimmerBase}`} />
      </div>
    </CardContent>
  </Card>
);

const TestimonialsWithApi = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await reviewAPI.getApprovedReviews();
        const mapped = Array.isArray(response?.reviews)
          ? response.reviews.map((review: Record<string, unknown>) => ({
              _id: String(review.id ?? review._id ?? crypto.randomUUID()),
              name: String(review.name ?? ""),
              email: String(review.email ?? ""),
              event: String(review.event ?? ""),
              content: String(review.content ?? ""),
              rating: Number(review.rating ?? 0),
              createdAt: new Date(String(review.createdAt ?? Date.now())).getTime(),
            }))
          : [];
        setReviews(mapped);
        setLoading(false);
        return;
      } catch {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    setErrorMsg("Could not load reviews at this time.");
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const sortedTestimonials = useMemo(
    () => [...reviews].sort((a, b) => b.createdAt - a.createdAt),
    [reviews]
  );

  const showEmpty = !loading && sortedTestimonials.length === 0 && !errorMsg;

  return (
    <section id="testimonials" className="section-mobile-padding bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-16" data-reveal>
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

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16">
            <SkeletonCard delay={0} />
            <SkeletonCard delay={150} />
            <SkeletonCard delay={300} />
          </div>
        )}

        {errorMsg && !loading && sortedTestimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{errorMsg}</p>
          </div>
        )}

        {showEmpty && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}

        {sortedTestimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16" data-reveal-stagger>
            {sortedTestimonials.map((testimonial) => (
              <Card key={testimonial._id} className="border-border" data-reveal data-reveal-item>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-foreground mb-4 sm:mb-6 italic whitespace-pre-line break-words line-clamp-4 sm:line-clamp-none">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name} said:</p>
                    <p className="text-sm text-muted-foreground">{testimonial.event}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(testimonial.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center" data-reveal>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 active:bg-accent transition-colors"
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
    </section>
  );
};

export const Testimonials = TestimonialsWithApi;