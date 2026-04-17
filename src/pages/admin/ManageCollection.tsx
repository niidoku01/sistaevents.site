import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CollectionCategory, staticCollectionImages, staticCollectionImagesByCategory } from "@/lib/staticCollections";

type CollectionImage = {
  _id: string;
  url: string;
  originalName: string;
  category: CollectionCategory;
};

const ManageCollection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | "all">("all");

  const getCategoryLabel = (category: CollectionCategory) => {
    switch (category) {
      case "weddings": return "Weddings & Celebrations";
      case "funerals": return "Funerals";
      case "corporate": return "Corporate Events";
      default: return "Uncategorized";
    }
  };

  const getCategoryColor = (category: CollectionCategory) => {
    switch (category) {
      case "weddings": return "bg-pink-100 text-pink-800";
      case "funerals": return "bg-gray-100 text-gray-800";
      case "corporate": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const localImages: CollectionImage[] =
    selectedCategory === "all"
      ? staticCollectionImages
      : staticCollectionImagesByCategory[selectedCategory];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Collection (Static Mode)</CardTitle>
        <CardDescription>
          Collection images now come from static assets in code to reduce image database usage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          To update collection images, edit <strong>src/lib/staticCollections.ts</strong>.
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={(value: "all" | CollectionCategory) => setSelectedCategory(value)}>
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

        {localImages && (
          <>
            {localImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No images</p>
                <p className="text-gray-400 text-sm">refresh the page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localImages.map((img) => (
                  <Card key={img._id} className="overflow-hidden hover:shadow-lg transition-shadow rounded-3xl">
                    <div className="aspect-video bg-gray-100 relative group rounded-2xl">
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className={getCategoryColor(img.category)}>
                          {getCategoryLabel(img.category)}
                        </Badge>
                      </div>
                      <img src={img.url} alt={img.originalName} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium truncate mb-2">{img.originalName}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Static Asset</p>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(img.category)}
                        </Badge>
                      </div>
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
