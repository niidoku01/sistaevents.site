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
    key: "decoratives items ",
    title: "Decorative items",
    category: "Aesthetics",
    description: "Rental option",
    available: true,
    images: [
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

  const isDecorativeDialog = selectedItem?.key.trim() === "decoratives";

  return (
    <section id="featured" className="py-20 lg:py-25 bg-background">
      <div className="container mx-auto px-3 lg:px-5">
        <div className="text-center mb-16" data-reveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Event Logistics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Decoratives for creating memorable events
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
                key={item.key}
                className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border cursor-pointer"
                data-reveal
                data-reveal-item
                tabIndex={item.images.length > 0 ? 0 : -1}
                role="button"
                aria-label={item.images.length > 0 ? `View ${item.title} gallery` : `${item.title} has no images`}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && item.images.length > 0) {
                    e.preventDefault();
                    openGallery(item, previewIdx);
                  }
                }}
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
                      loading={index < 3 ? "eager" : "lazy"}
                      fetchPriority={index < 3 ? "high" : "auto"}
                      decoding={index < 3 ? "sync" : "async"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      width={800}
                      height={600}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">No image enabled</div>
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
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
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
        <DialogContent className="p-0 bg-black/95 overflow-y-auto w-[96vw] sm:w-[94vw] md:w-[90vw] max-w-4xl max-h-[92vh] rounded-lg sm:rounded-2xl">
          {selectedItem && (
            <div className="relative w-full h-full min-h-0 flex flex-col">
              <button
                onClick={closeGallery}
                className={`absolute z-50 text-white hover:text-gray-300 transition-colors bg-black/70 rounded-full ${
                  isDecorativeDialog
                    ? "top-1.5 right-1.5 p-1 sm:top-3 sm:right-3 sm:p-2"
                    : "top-2 right-2 p-1.5 sm:top-3 sm:right-3 sm:p-2"
                }`}
                aria-label="Close gallery"
              >
                <X className={`${isDecorativeDialog ? "w-4 h-4 sm:w-6 sm:h-6" : "w-5 h-5 sm:w-6 sm:h-6"}`} />
              </button>

              <div className={`relative w-full flex items-center justify-center ${
                isDecorativeDialog
                  ? "h-[36vh] sm:h-[54vh] md:h-[62vh] p-1.5 sm:p-4 md:p-5"
                  : "h-[44vh] sm:h-[58vh] md:h-[62vh] p-2 sm:p-4 md:p-5"
              }`}>
                <img
                  src={selectedItem.images[currentImageIndex]}
                  alt={`${selectedItem.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  loading={currentImageIndex === 0 ? "eager" : "lazy"}
                  fetchPriority="high"
                  decoding="sync"
                  width={1600}
                  height={1200}
                />

                {selectedItem.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 sm:p-2.5 rounded-full transition-colors shadow-lg border border-white/20"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white p-2 sm:p-2.5 rounded-full transition-colors shadow-lg border border-white/20"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
              </div>

              <div className={`text-white border-t border-white/10 overflow-x-hidden ${
                isDecorativeDialog
                  ? "p-2 sm:p-4 max-h-[36vh] overflow-y-auto"
                  : "p-3 sm:p-4"
              }`}>
                <div className="flex items-center mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedItem.category}
                  </Badge>
                </div>
                <h3 className={`font-semibold mb-1 ${isDecorativeDialog ? "text-sm sm:text-lg" : "text-base sm:text-lg"}`}>
                  {selectedItem.title}
                </h3>
                <p className={`text-gray-300 ${isDecorativeDialog ? "text-xs mb-2" : "text-xs sm:text-sm mb-3"}`}>
                  {selectedItem.title === "Floral Arrangements" && selectedItem.imageDescriptions
                    ? selectedItem.imageDescriptions[currentImageIndex]
                    : selectedItem.description}
                </p>

                {/* Thumbnail navigation */}
                <div className={`flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 ${isDecorativeDialog ? "pt-0.5" : ""}`}>
                  {selectedItem.images.map((img, idx) => (
                    <button
                      key={`${selectedItem.key}-thumb-${idx}`}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 ${isDecorativeDialog ? "w-10 h-10 sm:w-12 sm:h-12" : "w-11 h-11 sm:w-12 sm:h-12"} rounded overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
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
