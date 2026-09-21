import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

type FieldErrors = {
  name?: string;
  email?: string;
  event?: string;
  content?: string;
  consent?: string;
};

export const ReviewForm = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    event: "",
    content: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const submitReview = useMutation(api.reviews.submitReview);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!formData.name.trim()) next.name = "Please enter your name";
    if (!formData.email.trim()) next.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      next.email = "Please enter a valid email";
    if (!formData.event.trim()) next.event = "Please enter the event type";
    if (!formData.content.trim()) next.content = "Please write your review";
    if (!consent) next.consent = "Please accept the data protection notice to continue";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      await submitReview({
        name: formData.name,
        email: formData.email,
        event: formData.event,
        content: formData.content,
        rating,
        consent,
      });

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review will be published upon admin approval.",
      });

      setFormData({ name: "", email: "", event: "", content: "" });
      setRating(5);
      setConsent(false);
      setErrors({});

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name as keyof FieldErrors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2.5">
        <label className="text-sm font-medium text-foreground/80">Rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform duration-200 hover:scale-125 active:scale-95"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 transition-colors duration-200 ${
                  star <= (hoveredRating || rating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/25"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground/80">
          Your Name
        </label>
        <div className="relative">
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name or nickname"
            className={errors.name ? "border-red-500/60 ring-red-500/20" : ""}
          />
          {errors.name && <FieldError message={errors.name} />}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground/80">
          Email
        </label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@mail.com"
            className={errors.email ? "border-red-500/60 ring-red-500/20" : ""}
          />
          {errors.email && <FieldError message={errors.email} />}
        </div>
      </div>

      {/* Event Type */}
      <div className="space-y-2">
        <label htmlFor="event" className="text-sm font-medium text-foreground/80">
          Event Type
        </label>
        <div className="relative">
          <Input
            id="event"
            name="event"
            value={formData.event}
            onChange={handleChange}
            placeholder="e.g., Wedding, Corporate Event, Birthday Party"
            className={errors.event ? "border-red-500/60 ring-red-500/20" : ""}
          />
          {errors.event && <FieldError message={errors.event} />}
        </div>
      </div>

      {/* Review */}
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-foreground/80">
          Your Review
        </label>
        <div className="relative">
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            maxLength={1000}
            placeholder="Tell us about your experience..."
            className={`resize-none pr-16 ${errors.content ? "border-red-500/60 ring-red-500/20" : ""}`}
          />
          <span
            className={cn(
              "pointer-events-none absolute right-1.5 bottom-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors",
              formData.content.length >= 950
                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                : "bg-foreground/5 text-muted-foreground/60 border border-border/60"
            )}
          >
            {formData.content.length}/1000
          </span>
          {errors.content && <FieldError message={errors.content} />}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/40 p-3.5">
        <input
          id="review-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--accent))]"
        />
        <label htmlFor="review-consent" className="text-xs text-muted-foreground leading-relaxed">
          I agree to the{" "}
          <a href="/privacy-policy" className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity">
            Privacy Policy
          </a>{" "}
          and consent to Sista Events &amp; Rentals publishing my name, event type, and review publicly, and storing
          my email address for moderation purposes.
        </label>
      </div>
      {errors.consent && (
        <p className="text-[11px] font-medium text-red-600 dark:text-red-400">Please accept the data protection notice to continue.</p>
      )}

      <Button
        type="submit"
        className="w-full active:scale-[0.98] transition-all duration-200 bg-gradient-to-r from-accent to-amber-500 hover:shadow-lg hover:shadow-accent/30 text-white font-semibold py-4 rounded-xl text-sm sm:text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit a review"}
      </Button>

      <p className="text-[11px] text-muted-foreground/50 text-center">
        Your review will be published upon admin approval.
      </p>
    </form>
  );
};

function FieldError({ message }: { message: string }) {
  return (
    <span className="absolute left-0 -bottom-1 translate-y-full inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10 animate-in fade-in slide-in-from-top-1 duration-200 z-20 pointer-events-none">
      {message}
    </span>
  );
}
