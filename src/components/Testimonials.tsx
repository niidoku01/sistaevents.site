import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ReviewForm } from "./ReviewForm";

const TestimonialsWithConvex = () => {
  const testimonials = useQuery(api.reviews.getApprovedReviews) || [];
  const [showForm, setShowForm] = useState(false);
  const sortedTestimonials = [...testimonials].sort((a, b) => b.createdAt - a.createdAt);

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
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium"
          >
            {showForm ? "Hide Review Form" : "Share Your Experience"}
          </button>
        </div>

        {showForm && (
          <div className="mb-16">
            <ReviewForm />
          </div>
        )}

        {sortedTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" data-reveal-stagger>
            {sortedTestimonials.map((testimonial) => (
              <Card key={testimonial._id} className="border-border" data-reveal data-reveal-item>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
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
      </div>
    </section>
  );
};

const TestimonialsFallback = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Don&apos;t just take our word for it - hear from our satisfied clients
          </p>
          <p className="text-muted-foreground">
            Reviews are currently unavailable. Please check back soon.
          </p>
        </div>
      </div>
    </section>
  );
};

export const Testimonials = () => {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl) {
    return <TestimonialsFallback />;
  }

  return <TestimonialsWithConvex />;
};
