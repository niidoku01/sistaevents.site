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
      images.flatware.flatware5,
      images.others.other1,
      images.others.other3,
      images.others.other4,
      images.others.other5,
      images.others.other6,
      images.others.other7,
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
    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-slate-200/60">
        <div className="space-y-1">
          <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">Logistics Availability</CardTitle>
          <p className="text-sm text-slate-600">Control which items and images are displayed in the gallery</p>
        </div>
        <div className="pt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="rounded-lg border-slate-200/60 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
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
              <div key={item.key} className="rounded-lg border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all duration-200 overflow-hidden group">
                {/* Item Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={primaryImage}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200/60 flex-none shadow-sm"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      width={64}
                      height={64}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                          {item.category}
                        </Badge>
                        <Badge 
                          className={`text-xs font-medium ${isAvailable ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}
                        >
                          {isAvailable ? '● Available' : '○ Unavailable'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {item.imageUrls.length} images {unavailableCount > 0 && `• ${unavailableCount} hidden`}
                      </p>
                    </div>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={(checked) => handleToggle(item.key, checked)}
                      aria-label={`Toggle availability for ${item.title}`}
                      className="flex-none mt-1"
                    />
                  </div>

                  {/* Expand Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(item.key)}
                    className="w-full rounded-lg border-slate-200/60 hover:bg-slate-50 text-slate-700 font-medium transition-colors text-sm h-8"
                  >
                    {isExpanded ? 'Hide Image Controls' : 'Show Image Controls'}
                  </Button>
                </div>

                {/* Image Controls */}
                {isExpanded && (
                  <div className="border-t border-slate-200/60 bg-slate-50/50 p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Image Availability</p>
                    <div className="space-y-2">
                      {item.imageUrls.map((imageUrl, imageIndex) => {
                        const imageKey = `${item.key}:${imageIndex}`;
                        const imageIsAvailable = imageAvailabilityMap.get(imageKey) ?? true;
                        return (
                          <div key={imageKey} className="rounded-lg border border-slate-200/60 bg-white px-3 py-2.5 flex items-center justify-between gap-3 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={imageUrl}
                                alt={`${item.title} ${imageIndex + 1}`}
                                className="w-11 h-11 rounded-lg object-cover border border-slate-200/60 flex-none shadow-sm"
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                width={44}
                                height={44}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800">Image {imageIndex + 1}</p>
                                <p className={`text-[11px] font-medium ${imageIsAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                  {imageIsAvailable ? '✓ Available' : '✕ Hidden'}
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
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageFeaturedAvailability;