import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  name: string;
  email: string;
  event: string;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: string;
}

export const ManageReviews = () => {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("http://localhost:5000/api/reviews/pending"),
        fetch("http://localhost:5000/api/reviews"),
      ]);

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      setPendingReviews(pendingData.reviews || []);
      setApprovedReviews(approvedData.reviews || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${id}/approve`, {
        method: "PUT",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Review approved successfully",
        });
        fetchReviews();
      } else {
        throw new Error("Failed to approve review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Review deleted successfully",
        });
        fetchReviews();
      } else {
        throw new Error("Failed to delete review");
      }
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
                  onClick={() => handleApprove(review.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(review.id)}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Pending Reviews ({pendingReviews.length})</h2>
          <Button variant="outline" onClick={fetchReviews}>
            Refresh
          </Button>
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
              <ReviewCard key={review.id} review={review} isPending={true} />
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
              <ReviewCard key={review.id} review={review} isPending={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
