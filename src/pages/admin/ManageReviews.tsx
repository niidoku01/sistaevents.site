import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const ManageReviews = () => {
  const { toast } = useToast();
  const pendingReviews = useQuery(api.reviews.getPendingReviews);
  const approvedReviews = useQuery(api.reviews.getApprovedReviews);
  const approveReview = useMutation(api.reviews.approveReview);
  const deleteReview = useMutation(api.reviews.deleteReview);

  const loading = pendingReviews === undefined || approvedReviews === undefined;

  const handleApprove = async (id: Id<"reviews">) => {
    try {
      await approveReview({ id });
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: Id<"reviews">) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReview({ id });
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const ReviewCard = ({ review, isPending }: { review: NonNullable<typeof pendingReviews>[number]; isPending: boolean }) => (
    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:to-slate-50 backdrop-blur-sm overflow-hidden group">
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{review.name}</h3>
              <p className="text-xs text-slate-500 truncate">{review.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs font-medium text-slate-600 bg-slate-100/60 px-2 py-1 rounded">
                  {review.event}
                </span>
              </div>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-amber-300 pl-3">
            "{review.content}"
          </p>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
            <p className="text-xs text-slate-500 font-medium">
              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <div className="flex gap-2">
              {isPending && (
                <Button
                  size="sm"
                  className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => handleApprove(review._id)}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-200/60 font-medium transition-colors"
                onClick={() => handleDelete(review._id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Pending Reviews</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                {pendingReviews.length}
              </span>
              <p className="text-sm text-slate-600">Awaiting approval</p>
            </div>
          </div>
        </div>

        {pendingReviews.length === 0 ? (
          <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-slate-500">
                <p className="font-medium">No pending reviews</p>
                <p className="text-sm mt-1">All reviews have been processed</p>
              </div>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Approved Reviews</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                {approvedReviews.length}
              </span>
              <p className="text-sm text-slate-600">Published and visible</p>
            </div>
          </div>
        </div>

        {approvedReviews.length === 0 ? (
          <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-slate-500">
                <p className="font-medium">No approved reviews yet</p>
                <p className="text-sm mt-1">Approve pending reviews to display them</p>
              </div>
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

export default ManageReviews;
