import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Id } from "../../../convex/_generated/dataModel";
import { reviewAPI } from "@/lib/api";

type Review = {
  _id: Id<"reviews"> | string;
  name: string;
  email: string;
  event: string;
  content: string;
  rating: number;
  createdAt: number;
  source: "convex" | "server";
};

export const ManageReviews = () => {
  const { toast } = useToast();
  const convexPendingReviews = useQuery(api.reviews.getPendingReviews);
  const convexApprovedReviews = useQuery(api.reviews.getApprovedReviews);
  const approveReview = useMutation(api.reviews.approveReview);
  const deleteReview = useMutation(api.reviews.deleteReview);
  const [serverPendingReviews, setServerPendingReviews] = useState<Review[]>([]);
  const [serverApprovedReviews, setServerApprovedReviews] = useState<Review[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);

  const refreshLegacyReviews = async () => {
    const [pendingResponse, approvedResponse] = await Promise.all([
      reviewAPI.getPendingReviews(),
      reviewAPI.getApprovedReviews(),
    ]);

    const pending = Array.isArray(pendingResponse?.reviews)
      ? pendingResponse.reviews.map((review: Record<string, unknown>) => ({
          _id: String(review.id ?? review._id ?? crypto.randomUUID()),
          name: String(review.name ?? ""),
          email: String(review.email ?? ""),
          event: String(review.event ?? ""),
          content: String(review.content ?? ""),
          rating: Number(review.rating ?? 0),
          createdAt: new Date(String(review.createdAt ?? Date.now())).getTime(),
          source: "server" as const,
        }))
      : [];

    const approved = Array.isArray(approvedResponse?.reviews)
      ? approvedResponse.reviews.map((review: Record<string, unknown>) => ({
          _id: String(review.id ?? review._id ?? crypto.randomUUID()),
          name: String(review.name ?? ""),
          email: String(review.email ?? ""),
          event: String(review.event ?? ""),
          content: String(review.content ?? ""),
          rating: Number(review.rating ?? 0),
          createdAt: new Date(String(review.createdAt ?? Date.now())).getTime(),
          source: "server" as const,
        }))
      : [];

    setServerPendingReviews(pending);
    setServerApprovedReviews(approved);
    setUsingFallback(pending.length > 0 || approved.length > 0);
  };

  useEffect(() => {
    if (convexPendingReviews === undefined || convexApprovedReviews === undefined) {
      return;
    }

    if (convexPendingReviews.length === 0 && convexApprovedReviews.length === 0) {
      void refreshLegacyReviews().catch(() => {
        setServerPendingReviews([]);
        setServerApprovedReviews([]);
        setUsingFallback(false);
      });
      return;
    }

    setServerPendingReviews([]);
    setServerApprovedReviews([]);
    setUsingFallback(false);
  }, [convexPendingReviews, convexApprovedReviews]);

  const pendingReviews = useMemo(
    () => (usingFallback ? serverPendingReviews : (convexPendingReviews ?? [])),
    [usingFallback, convexPendingReviews, serverPendingReviews]
  );
  const approvedReviews = useMemo(
    () => (usingFallback ? serverApprovedReviews : (convexApprovedReviews ?? [])),
    [usingFallback, convexApprovedReviews, serverApprovedReviews]
  );

  const removeFromLegacyState = (reviewId: string) => {
    setServerPendingReviews((current) => current.filter((review) => String(review._id) !== reviewId));
    setServerApprovedReviews((current) => current.filter((review) => String(review._id) !== reviewId));
  };

  const moveToLegacyApproved = (reviewId: string) => {
    setServerPendingReviews((current) => {
      const review = current.find((item) => String(item._id) === reviewId);
      if (!review) return current;
      setServerApprovedReviews((approved) => [...approved, { ...review, source: "server" as const }]);
      return current.filter((item) => String(item._id) !== reviewId);
    });
  };

  const handleApprove = async (review: Review) => {
    try {
      if (review.source === "server") {
        await reviewAPI.approveReview(review._id);
        await refreshLegacyReviews();
      } else {
        await approveReview({ id: review._id as Id<"reviews"> });
      }
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      if (review.source === "server") {
        await reviewAPI.deleteReview(review._id);
        await refreshLegacyReviews();
      } else {
        await deleteReview({ id: review._id as Id<"reviews"> });
      }
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const ReviewCard = ({ review, isPending }: { review: Review; isPending: boolean }) => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{review.name}</h3>
              <p className="text-sm text-muted-foreground">{review.email}</p>
              <p className="text-sm text-muted-foreground">{review.event}</p>
            </div>
            <div className="flex gap-1">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
          </div>

          <p className="text-sm italic">"{review.content}"</p>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              {isPending && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(review)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(review)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {usingFallback && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            Showing reviews from the legacy backend because Convex currently has no review records.
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Pending Reviews ({pendingReviews.length})</h2>
        </div>

        {pendingReviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No pending reviews
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviews.map((review) => (
              <ReviewCard key={review._id} review={review} isPending={true} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Approved Reviews ({approvedReviews.length})</h2>
        {approvedReviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No approved reviews yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedReviews.map((review) => (
              <ReviewCard key={review._id} review={review} isPending={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
