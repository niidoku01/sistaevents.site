import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Image as ImageIcon, GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type CollectionImage = {
  _id: Id<"images">;
  storageId: Id<"_storage">;
  filename: string;
  url: string | null;
  uploadedAt: number;
  originalName: string;
  size: number;
  contentType: string;
  order: number | undefined;
  category?: "weddings" | "funerals" | "corporate";
};

const ManageCollection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<"weddings" | "funerals" | "corporate" | "all">("all");
  const allImages = useQuery(api.collections.listImages, {});
  const filteredImages = useQuery(
    api.collections.listImages, 
    selectedCategory === "all" ? {} : { category: selectedCategory as "weddings" | "funerals" | "corporate" }
  );
  const deleteImageMutation = useMutation(api.collections.deleteImage);
  const reorderImagesMutation = useMutation(api.collections.reorderImages);
  const [deleteStatus, setDeleteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<CollectionImage[]>([]);

  // Update local images when Convex data changes
  React.useEffect(() => {
    if (filteredImages) {
      setLocalImages([...filteredImages].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0);
      }));
    }
  }, [filteredImages]);

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "weddings": return "Weddings & Celebrations";
      case "funerals": return "Funerals";
      case "corporate": return "Corporate Events";
      default: return "Uncategorized";
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "weddings": return "bg-pink-100 text-pink-800";
      case "funerals": return "bg-gray-100 text-gray-800";
      case "corporate": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const handleDelete = async (imageId: Id<"images">, storageId: Id<"_storage">, filename: string) => {
    setDeleteStatus(null);
    try {
      await deleteImageMutation({ id: imageId, storageId });
      setDeleteStatus({ type: "success", message: "Image deleted successfully" });
    } catch (err: any) {
      setDeleteStatus({ type: "error", message: err.message });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...localImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setLocalImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    // Save the new order to the database
    try {
      const imageIds = localImages.map(img => img._id);
      await reorderImagesMutation({ imageIds });
      setDeleteStatus({ type: "success", message: "Images reordered successfully" });
    } catch (err: any) {
      setDeleteStatus({ type: "error", message: "Failed to save new order" });
    }
    
    setDraggedIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Collection</CardTitle>
        <CardDescription>View and manage your gallery collection images. Drag to reorder.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label className="mb-2 block">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={(value: "all" | "weddings" | "funerals" | "corporate") => setSelectedCategory(value)}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="weddings">Weddings & Celebrations</SelectItem>
              <SelectItem value="funerals">Funerals</SelectItem>
              <SelectItem value="corporate">Corporate Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredImages === undefined && <p className="text-gray-500">Loading images...</p>}
        {deleteStatus && (
          <Alert variant={deleteStatus.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{deleteStatus.message}</AlertDescription>
          </Alert>
        )}
        
        {localImages && (
          <>
            {localImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No images in collection</p>
                <p className="text-gray-400 text-sm">Upload images to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localImages.map((img, index) => (
                  <Card 
                    key={img._id} 
                    className="overflow-hidden cursor-move hover:shadow-lg transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="aspect-video bg-gray-100 relative group">
                      <div className="absolute top-2 left-2 z-10 bg-white/80 rounded p-1">
                        <GripVertical className="w-5 h-5 text-gray-600" />
                      </div>
                      {img.category && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className={getCategoryColor(img.category)}>
                            {getCategoryLabel(img.category)}
                          </Badge>
                        </div>
                      )}
                      {img.url && (
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium truncate mb-2">{img.originalName}</p>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-500">
                          {new Date(img.uploadedAt).toLocaleDateString()}
                        </p>
                        {img.category && (
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(img.category)}
                          </Badge>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Image</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{img.originalName}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(img._id, img.storageId, img.filename)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageCollection;
