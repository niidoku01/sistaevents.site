import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Category = "weddings" | "funerals" | "corporate";

const categoryInfo = {
  weddings: {
    title: "Weddings & Celebrations",
   
  },
  funerals: {
    title: "Funerals",
  },
  corporate: {
    title: "Corporate Events",
    
  }
};

export default function OurCollection() {
  const { toast } = useToast();
  const weddingImages = useQuery(api.collections.listImages, { category: "weddings" }) ?? [];
  const funeralImages = useQuery(api.collections.listImages, { category: "funerals" }) ?? [];
  const corporateImages = useQuery(api.collections.listImages, { category: "corporate" }) ?? [];
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Get category images based on selection
  const categoryImages = selectedCategory === "weddings" ? weddingImages 
    : selectedCategory === "funerals" ? funeralImages
    : selectedCategory === "corporate" ? corporateImages
    : null;

  // Get current image URL
  const currentImage = currentImageIndex !== null && categoryImages && categoryImages[currentImageIndex]
    ? categoryImages[currentImageIndex].url
    : null;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Navigation functions
  const goToNextImage = () => {
    if (currentImageIndex !== null && categoryImages && currentImageIndex < categoryImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const goToPreviousImage = () => {
    if (currentImageIndex !== null && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const closeViewer = () => {
    setCurrentImageIndex(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentImageIndex === null) return;
      
      if (e.key === "ArrowRight") {
        goToNextImage();
      } else if (e.key === "ArrowLeft") {
        goToPreviousImage();
      } else if (e.key === "Escape") {
        closeViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentImageIndex, categoryImages]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextImage();
    }
    if (isRightSwipe) {
      goToPreviousImage();
    }
  };

  // Helper function to get cover image for a category
  const getCoverImage = (images: any[] | undefined) => {
    if (!images || images.length === 0) return "https://via.placeholder.com/800x600?text=No+Images";
    return images[0]?.url || "https://via.placeholder.com/800x600?text=No+Images";
  };

  // Helper function to render image grid for selected category
  const renderImageGrid = (images: any[] | undefined) => {
    if (!images || images.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">no images found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((img, i) => (
          <div 
            key={img._id || i} 
            className="group relative overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => setCurrentImageIndex(i)}
          >
            <div className="aspect-square bg-gray-100">
              <img 
                src={img.url} 
                alt={img.originalName || `Image ${i + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <Header />
      
      <div className="w-full bg-white">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 tracking-wide py-10 mb-4 mt-16">Our Collection</h1>
      </div>
      <main className="flex-1 overflow-x-hidden bg-white">
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
            {!selectedCategory ? (
              /* Category Selection View */
              <div>
                <p className="text-center text-lg text-gray-600 mb-8">
    
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {/* Weddings & Celebrations Card */}
                  <div 
                    className="group cursor-pointer"
                    onClick={() => setSelectedCategory("weddings")}
                  >
                    <div className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                      <div className="aspect-[3/4] bg-gray-100">
                        <img 
                          src={getCoverImage(weddingImages)} 
                          alt="Weddings & Celebrations"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold">{categoryInfo.weddings.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Funerals Card */}
                  <div 
                    className="group cursor-pointer"
                    onClick={() => setSelectedCategory("funerals")}
                  >
                    <div className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                      <div className="aspect-[3/4] bg-gray-100">
                        <img 
                          src={getCoverImage(funeralImages)} 
                          alt="Funerals"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold">{categoryInfo.funerals.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Corporate Events Card */}
                  <div 
                    className="group cursor-pointer"
                    onClick={() => setSelectedCategory("corporate")}
                  >
                    <div className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                      <div className="aspect-[3/4] bg-gray-100">
                        <img 
                          src={getCoverImage(corporateImages)} 
                          alt="Corporate Events"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-2xl font-bold">{categoryInfo.corporate.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Category Images View */
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCategory(null)}
                  className="mb-6 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
              
                </Button>
                
                <div className="mb-8">
                  <h2 className="text-gray-500 text-3xl font-semibold mb-2">
                    {selectedCategory && categoryInfo[selectedCategory].title}
                  </h2>
                  <div className="h-1 w-20 bg-accent rounded" />
                </div>

                <div className="py-4">
                  {renderImageGrid(categoryImages)}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Image Viewer Modal */}
      <Dialog open={currentImageIndex !== null} onOpenChange={closeViewer}>
        <DialogContent 
          className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous button */}
          {currentImageIndex !== null && currentImageIndex > 0 && (
            <button
              onClick={goToPreviousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Next button */}
          {currentImageIndex !== null && categoryImages && currentImageIndex < categoryImages.length - 1 && (
            <button
              onClick={goToNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Image counter */}
          {currentImageIndex !== null && categoryImages && (
            <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {currentImageIndex + 1} / {categoryImages.length}
            </div>
          )}

          {/* Image display */}
          {currentImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={currentImage}
                alt="Full size view"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
