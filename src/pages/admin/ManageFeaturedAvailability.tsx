import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { images } from "@/lib/imageImports";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getLogisticsAvailability,
  LOGISTICS_AVAILABILITY_EVENT,
  resetLogisticsAvailability,
  setLogisticsImageAvailability,
  setLogisticsItemAvailability,
} from "@/lib/logisticsAvailability";

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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [availabilityState, setAvailabilityState] = useState(getLogisticsAvailability());

  useEffect(() => {
    const refresh = () => setAvailabilityState(getLogisticsAvailability());

    window.addEventListener(LOGISTICS_AVAILABILITY_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(LOGISTICS_AVAILABILITY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const availabilityMap = new Map(Object.entries(availabilityState.items));
  const imageAvailabilityMap = new Map(
    Object.entries(availabilityState.images)
  );

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleToggle = (key: string, nextValue: boolean) => {
    setLogisticsItemAvailability(key, nextValue);
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: "Updated",
      description: `Item is now ${nextValue ? "available" : "unavailable"}.`,
    });
  };

  const handleImageToggle = (itemKey: string, imageIndex: number, nextValue: boolean) => {
    setLogisticsImageAvailability(itemKey, imageIndex, nextValue);
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: "Updated",
      description: `Image ${imageIndex + 1} is now ${nextValue ? "available" : "unavailable"}.`,
    });
  };

  const handleReset = () => {
    resetLogisticsAvailability();
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: "Reset complete",
      description: "Logistics availability restored to default values.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available items</CardTitle>
        <div className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Reset Logistics Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {featuredItems.map((item) => {
            const isAvailable = availabilityMap.get(item.key) ?? true;
            const unavailableCount = item.imageUrls.filter((_, imageIndex) => {
              const imageKey = `${item.key}:${imageIndex}`;
              return !(imageAvailabilityMap.get(imageKey) ?? true);
            }).length;
            const isExpanded = !!expandedItems[item.key];
            const primaryImage = item.imageUrls[0];

            return (
              <div key={item.key} className="rounded-lg border p-3 sm:p-4 bg-white space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={primaryImage}
                    alt={item.title}
                    className="w-14 h-14 rounded-md object-cover border border-slate-200 flex-none"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className={`text-xs font-medium ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.imageUrls.length} images | {unavailableCount} unavailable
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(checked) => handleToggle(item.key, checked)}
                    aria-label={`Toggle availability for ${item.title}`}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 rounded-md border bg-slate-50 px-3 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(item.key)}
                    className="h-8"
                  >
                    {isExpanded ? "Hide details" : "Show details"}
                  </Button>
                </div>

                {isExpanded ? (
                  <div className="rounded-md bg-slate-50 border p-2.5 sm:p-3">
                    <p className="text-xs text-slate-600 mb-2">Image controls</p>
                    <div className="space-y-2">
                      {item.imageUrls.map((imageUrl, imageIndex) => {
                        const imageKey = `${item.key}:${imageIndex}`;
                        const imageIsAvailable = imageAvailabilityMap.get(imageKey) ?? true;
                        return (
                          <div key={imageKey} className="rounded border bg-white px-2.5 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={imageUrl}
                                alt={`${item.title} ${imageIndex + 1}`}
                                className="w-10 h-10 rounded object-cover border border-slate-200"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">Image {imageIndex + 1}</p>
                                <p className={`text-[11px] ${imageIsAvailable ? "text-green-600" : "text-red-600"}`}>
                                  {imageIsAvailable ? "Available" : "Unavailable"}
                                </p>
                              </div>
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
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageFeaturedAvailability;