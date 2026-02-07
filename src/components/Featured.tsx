import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { images } from "@/lib/imageImports";

const featuredItems = [
  {
    title: "Crystal lighting",
    category: "Lighting",
    description: "Stunning event lighting",
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
    title: "Chairs",
    category: "Seating",
    description: "Classic elegance for any event",
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
    title: "Tables",
    category: "Tables",
    description: "Rustic charm meets modern style",
    available: true,
    images: [
      images.tables.table2,
      images.tables.table3,
    ],
  },
  {
    title: "Stretch Tents",
    category: "Tents",
    description: "Outdoor coverage",
    available: true,
    images: [
      images.tents.tent3,
      images.tents.tent2,
      images.tents.tent1,
      images.tents.tent4,
    ],
  },
  {
    title: "Decorative pieces",
    category: "Aesthetics",
    description: "Events aesthetics",
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
    title: "Floral Arrangements",
    category: "Decor",
    description: "Fresh and silk arrangements",
    available: true,
    images: [
      images.misc.sistaEvents,
      images.flowers.flower1,
      images.flowers.flower2,
      images.flowers.flower3,
      images.flowers.flower4,
      images.flowers.flower5,
    ],
  },
];
 

export const Featured = () => {
  const [selectedItem, setSelectedItem] = useState<typeof featuredItems[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openGallery = (item: typeof featuredItems[0], index: number = 0) => {
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Featured Logistics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Popular choices for creating memorable events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredItems.map((item, index) => (
            <Card
              key={index}
              className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border cursor-pointer"
              onClick={() => openGallery(item)}
            >
              <div className={`aspect-[4/3] sm:aspect-video lg:aspect-[4/3] relative overflow-hidden flex items-center justify-center ${
                item.category === "Aesthetics" || item.category === "Decor" ? "bg-white/5 p-0" : "bg-white/5 p-3"
              }`}>
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                    item.category === "Aesthetics" || item.category === "Decor" ? "object-cover" : "object-contain"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                {item.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    +{item.images.length - 1} more
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  {item.available && (
                    <span className="text-xs text-accent font-medium">Available</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
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
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedItem.category}
                  </Badge>
                  <span className="text-xs text-gray-300">
                    {currentImageIndex + 1} / {selectedItem.images.length}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-1">{selectedItem.title}</h3>
                <p className="text-sm text-gray-300 mb-3">{selectedItem.description}</p>

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
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
