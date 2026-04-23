import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { images } from "@/lib/imageImports";
import { getLogisticsAvailability, LOGISTICS_AVAILABILITY_EVENT } from "@/lib/logisticsAvailability";

type FeaturedItem = {
  key: string;
  title: string;
  category: string;
  description: string;
  available: boolean;
  images: string[];
  imageDescriptions?: string[];
};

const featuredItems: FeaturedItem[] = [
  {
    key: "crystal-lighting",
    title: "Crystal lighting",
    category: "Lighting",
    description: "Rental option",
    available: true,
    images: [
      images.lights.light3,
      images.lights.light4,
      images.lights.light2,
      images.lights.light1,
      images.lights.light5,
    ],
  },
  {
    key: "chairs",
    title: "Chairs",
    category: "Seating",
    description: "Rental option",
    available: true,
    images: [
      images.chairs.chair4,
      images.chairs.chair2,
      images.chairs.chair3,
      images.chairs.chair1,
      images.chairs.chair5,
      images.chairs.chair6,
    ],
  },
  {
    key: "tables",
    title: "Tables",
    category: "Setup",
    description: "Rental option",
    available: true,
    images: [
      images.tables.table2,
      images.tables.table3,
    ],
  },
  {
    key: "stretch-tents",
    title: "Stretch Tents",
    category: "Outdoor coverage",
    description: "Rental option",
    available: true,
    images: [
      images.tents.tent3,
      images.tents.tent2,
      images.tents.tent1,
      images.tents.tent4,
    ],
  },
  {
    key: "decorative-pieces",
    title: "Decorative pieces",
    category: "Aesthetics",
    description: "Rental option",
    available: true,
    images: [
      images.flatware.flatware2,
      images.flatware.flatware1,
      images.others.other2,
      images.others.other3,
      images.others.other4,
      images.flatware.flatware5
      
    ],
  },
  {
    key: "floral-arrangements",
    title: "Floral Arrangements",
    category: "Decor",
    description: "",
    available: true,
    images: [
      images.misc.sistaEvents,
      images.flowers.flower1,
      images.flowers.flower2,
      images.flowers.flower3,
      images.flowers.flower4,
      images.flowers.flower5,
    ],
    imageDescriptions: [
      "Rental option",
      "Rental option",
      "Sales option",
      "Rental option",
      "Sales option",
      "Sales option"
    ],
  },
];
 

export const Featured = () => {
  const [selectedItem, setSelectedItem] = useState<FeaturedItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availabilityState, setAvailabilityState] = useState(getLogisticsAvailability());

  useEffect(() => {
    const updateAvailability = () => {
      setAvailabilityState(getLogisticsAvailability());
    };

    window.addEventListener(LOGISTICS_AVAILABILITY_EVENT, updateAvailability);
    window.addEventListener("storage", updateAvailability);

    return () => {
      window.removeEventListener(LOGISTICS_AVAILABILITY_EVENT, updateAvailability);
      window.removeEventListener("storage", updateAvailability);
    };
  }, []);

  const availabilityMap = new Map(Object.entries(availabilityState.items));
  const imageAvailabilityMap = new Map(
    Object.entries(availabilityState.images)
  );

  const featuredItemsWithAvailability = featuredItems.map((item) => {
    const enabledEntries = item.images
      .map((img, imageIndex) => ({
        img,
        imageIndex,
        description: item.imageDescriptions?.[imageIndex],
      }))
      .filter((entry) => imageAvailabilityMap.get(`${item.key}:${entry.imageIndex}`) ?? true);

    const hasEnabledImages = enabledEntries.length > 0;

    return {
      ...item,
      available: (availabilityMap.get(item.key) ?? item.available) && hasEnabledImages,
      images: hasEnabledImages ? enabledEntries.map((entry) => entry.img) : [],
      imageDescriptions: item.imageDescriptions
        ? hasEnabledImages
          ? enabledEntries.map((entry) => entry.description ?? "")
          : []
        : undefined,
    };
  });

  const openGallery = (item: FeaturedItem, index: number = 0) => {
    setSelectedItem(item);
    setCurrentImageIndex(index);
  };

  const closeGallery = () => {
    setSelectedItem(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedItem) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedItem.images.length);
    }
  };

  const prevImage = () => {
    if (selectedItem) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedItem.images.length) % selectedItem.images.length);
    }
  };

  return (
    <section id="featured" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16" data-reveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Featured Logistics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Popular choices for creating memorable events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" data-reveal-stagger>
          {featuredItemsWithAvailability.map((item, index) => {
            // For Floral Arrangements, show per-image description
            const isFloral = item.title === "Floral Arrangements" && item.imageDescriptions;
            const previewIdx = 0;
            const previewDesc = isFloral
              ? item.imageDescriptions?.[previewIdx] ?? item.description
              : item.description;
            return (
              <Card
                key={index}
                className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border cursor-pointer"
                data-reveal
                data-reveal-item
                onClick={() => {
                  if (item.images.length === 0) {
                    return;
                  }
                  openGallery(item, previewIdx);
                }}
              >
                <div className={`aspect-[4/3] relative overflow-hidden flex items-center justify-center ${
                  item.category === "Aesthetics" || item.category === "Decor" ? "bg-white/5 p-0" : "bg-white/5 p-3"
                }`}>
                  {item.images.length > 0 ? (
                    <img
                      src={item.images[previewIdx]}
                      alt={item.title}
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                        item.category === "Aesthetics" || item.category === "Decor" ? "object-cover" : "object-contain"
                      }`}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">No image enabled</div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    <span className={`text-xs font-semibold ${item.available ? "text-emerald-700" : "text-red-700"}`}>
                      {item.available ? "Available" : "Rented Out"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {previewDesc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Image Gallery Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={closeGallery}>
        <DialogContent className={`p-0 bg-black/95 overflow-hidden ${
          selectedItem?.category === "Lighting" || 
          selectedItem?.category === "Seating" || 
          selectedItem?.category === "Aesthetics" || 
          selectedItem?.category === "Decor"
            ? "w-[95vw] max-w-lg max-h-[90vh]"
            : "w-[90vw] max-w-2xl max-h-[90vh]"
        }`}>
          {selectedItem && (
            <div className="relative w-full h-full flex flex-col">
              <button
                onClick={closeGallery}
                className="absolute top-2 right-2 z-50 text-white hover:text-gray-300 transition-colors bg-black/60 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`relative w-full flex items-center justify-center ${
                selectedItem.category === "Lighting" || 
                selectedItem.category === "Seating" || 
                selectedItem.category === "Aesthetics" || 
                selectedItem.category === "Decor"
                  ? "h-[60vh] p-4"
                  : "h-[60vh] p-5"
              }`}>
                <img
                  src={selectedItem.images[currentImageIndex]}
                  alt={`${selectedItem.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />

                {selectedItem.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 rounded-full transition-colors shadow-lg border border-white/20"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 rounded-full transition-colors shadow-lg border border-white/20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              <div className="p-3 text-white border-t border-white/10">
                <div className="flex items-center mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedItem.category}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-1">{selectedItem.title}</h3>
                <p className="text-sm text-gray-300 mb-3">
                  {selectedItem.title === "Floral Arrangements" && selectedItem.imageDescriptions
                    ? selectedItem.imageDescriptions[currentImageIndex]
                    : selectedItem.description}
                </p>

                {/* Thumbnail navigation */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {selectedItem.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
