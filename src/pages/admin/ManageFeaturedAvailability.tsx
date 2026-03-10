import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { images } from "@/lib/imageImports";

const featuredItems = [
  {
    key: "crystal-lighting",
    title: "Crystal lighting",
    category: "Lighting",
    imageUrls: [images.lights.light3, images.lights.light4, images.lights.light2, images.lights.light1, images.lights.light5],
  },
  {
    key: "chairs",
    title: "Chairs",
    category: "Seating",
    imageUrls: [images.chairs.chair4, images.chairs.chair2, images.chairs.chair3, images.chairs.chair1, images.chairs.chair5, images.chairs.chair6],
  },
  {
    key: "tables",
    title: "Tables",
    category: "Setup",
    imageUrls: [images.tables.table2, images.tables.table3],
  },
  {
    key: "stretch-tents",
    title: "Stretch Tents",
    category: "Outdoor coverage",
    imageUrls: [images.tents.tent3, images.tents.tent2, images.tents.tent1, images.tents.tent4],
  },
  {
    key: "decorative-pieces",
    title: "Decorative pieces",
    category: "Aesthetics",
    imageUrls: [
      images.flatware.flatware2,
      images.flatware.flatware1,
      images.others.other2,
      images.others.other3,
      images.others.other4,
      images.flatware.flatware5,
    ],
  },
  {
    key: "floral-arrangements",
    title: "Floral Arrangements",
    category: "Decor",
    imageUrls: [
      images.misc.sistaEvents,
      images.flowers.flower1,
      images.flowers.flower2,
      images.flowers.flower3,
      images.flowers.flower4,
      images.flowers.flower5,
    ],
  },
] as const;

const ManageFeaturedAvailability = () => {
  const { toast } = useToast();
  const availability = useQuery(api.featuredItems.listAvailability, {});
  const imageAvailability = useQuery(api.featuredItems.listImageAvailability, {});
  const setAvailability = useMutation(api.featuredItems.setAvailability);
  const setImageAvailability = useMutation(api.featuredItems.setImageAvailability);

  const availabilityMap = new Map((availability ?? []).map((item) => [item.key, item.available]));
  const imageAvailabilityMap = new Map(
    (imageAvailability ?? []).map((item) => [`${item.itemKey}:${item.imageIndex}`, item.available])
  );

  const handleToggle = async (key: string, nextValue: boolean) => {
    try {
      await setAvailability({ key, available: nextValue });
      toast({
        title: "Updated",
        description: `Item is now ${nextValue ? "available" : "unavailable"}.`,
      });
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update item availability.",
        variant: "destructive",
      });
    }
  };

  const handleImageToggle = async (itemKey: string, imageIndex: number, nextValue: boolean) => {
    try {
      await setImageAvailability({ itemKey, imageIndex, available: nextValue });
      toast({
        title: "Updated",
        description: `Image ${imageIndex + 1} is now ${nextValue ? "available" : "unavailable"}.`,
      });
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update image availability.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available items</CardTitle>
        <CardDescription>Control which featured items are available to clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredItems.map((item) => {
            const isAvailable = availabilityMap.get(item.key) ?? true;
            return (
              <div key={item.key} className="rounded-lg border p-4 bg-white space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className={`text-xs font-medium ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(checked) => handleToggle(item.key, checked)}
                    aria-label={`Toggle availability for ${item.title}`}
                  />
                </div>

                <div className="rounded-md bg-slate-50 border p-2">
                  <p className="text-xs text-slate-600 mb-2">Image controls</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {item.imageUrls.map((imageUrl, imageIndex) => {
                      const imageKey = `${item.key}:${imageIndex}`;
                      const imageIsAvailable = imageAvailabilityMap.get(imageKey) ?? true;
                      return (
                        <div key={imageKey} className="rounded border bg-white px-2 py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={imageUrl}
                              alt={`${item.title} ${imageIndex + 1}`}
                              className="w-8 h-8 rounded object-cover border border-slate-200"
                            />
                            <span className="text-xs text-slate-700 truncate">Image {imageIndex + 1}</span>
                          </div>
                          <Switch
                            checked={imageIsAvailable}
                            onCheckedChange={(checked) => handleImageToggle(item.key, imageIndex, checked)}
                            aria-label={`Toggle image ${imageIndex + 1} for ${item.title}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageFeaturedAvailability;