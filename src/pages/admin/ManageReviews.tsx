import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ManageReviews = () => {
  const { toast } = useToast();
  const pendingReviews = useQuery(api.reviews.getPendingReviews) || [];
  const approvedReviews = useQuery(api.reviews.getApprovedReviews) || [];
  const approveReview = useMutation(api.reviews.approveReview);
  const deleteReview = useMutation(api.reviews.deleteReview);

  const handleApprove = async (id: string) => {
    try {
      await approveReview({ id: id as any });
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReview({ id: id as any });
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

  const ReviewCard = ({ review, isPending }: { review: any; isPending: boolean }) => (
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
                  onClick={() => handleApprove(review._id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(review._id)}
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
