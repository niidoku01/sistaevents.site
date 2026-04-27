import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { staticCollectionImagesByCategory } from "../lib/staticCollections";

type Category = "weddings" | "funerals" | "corporate";

const categoryOrder: Category[] = ["weddings", "funerals", "corporate"];

const categoryTitleMap: Record<Category, string> = {
  weddings: "Weddings & Celebrations",
  funerals: "Funerals",
  corporate: "Corporate Events",
};

const categoryMobileLabelMap: Record<Category, string> = {
  weddings: "Weddings",
  funerals: "Funerals",
  corporate: "Corporate",
};

type CollectionImage = {
  _id?: string;
  url: string;
  originalName?: string;
};

const PRIORITY_GRID_IMAGES = 4;
const INITIAL_VISIBLE_IMAGES = 12;
const LOAD_MORE_STEP = 12;

export default function OurCollection() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_IMAGES);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const imagesByCategory: Record<Category, CollectionImage[]> = {
    weddings: staticCollectionImagesByCategory.weddings,
    funerals: staticCollectionImagesByCategory.funerals,
    corporate: staticCollectionImagesByCategory.corporate,
  };

  const categoryImages = selectedCategory ? imagesByCategory[selectedCategory] : null;
  const visibleCategoryImages = useMemo(() => {
    if (!categoryImages) {
      return null;
    }

    return categoryImages.slice(0, visibleCount);
  }, [categoryImages, visibleCount]);

  const hasMoreImages = Boolean(categoryImages && visibleCategoryImages && visibleCategoryImages.length < categoryImages.length);

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

  const loadMoreImages = () => {
    if (!categoryImages) {
      return;
    }

    setVisibleCount((previous) => Math.min(previous + LOAD_MORE_STEP, categoryImages.length));
  };

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    setVisibleCount(INITIAL_VISIBLE_IMAGES);
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || !hasMoreImages || !loadMoreRef.current) {
      return;
    }

    const node = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMoreImages();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [selectedCategory, hasMoreImages, visibleCount, categoryImages]);

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
  const getCoverImage = (images: CollectionImage[] | undefined, category?: Category) => {
    if (!images || images.length === 0) return "https://via.placeholder.com/800x600?text=No+Images";
    
    // Use last image for corporate, first for others
    if (category === "corporate" && images.length > 0) {
      return images[images.length - 1]?.url || "https://via.placeholder.com/800x600?text=No+Images";
    }
    
    return images[0]?.url || "https://via.placeholder.com/800x600?text=No+Images";
  };

  // Helper function to render image grid for selected category
  const renderImageGrid = (images: CollectionImage[] | undefined) => {
    if (!images || images.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-slate-600 font-medium">No images found in this collection yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
        {images.map((img, i) => (
          <div 
            key={img._id || i} 
            className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => setCurrentImageIndex(i)}
            style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}
          >
            <div className="aspect-[4/3] bg-slate-100">
              <img 
                src={img.url} 
                alt={img.originalName || `Image ${i + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading={i < PRIORITY_GRID_IMAGES ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-slate-50">
      <Header />

      <main className="flex-1 overflow-x-hidden pt-20 sm:pt-24 pb-10">
        <section className="pt-6 sm:pt-10">
          <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-sky-50 px-6 sm:px-8 py-8 sm:py-10 mb-8 sm:mb-10">
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />

              <div className="relative">
                <h1 className="text-1xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-amber-500 bg-clip-text text-transparent tracking-tight">OUR COLLECTION</h1>
                <p className="mt-2 text-sm sm:text-base text-slate-700">Gallery Experience</p>
              </div>
            </div>

            {!selectedCategory ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
                  {categoryOrder.map((category) => {
                    const images = imagesByCategory[category];
                    return (
                      <button
                        key={category}
                        type="button"
                        className="group text-left"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-2xl transition-all duration-300">
                          <div className="aspect-[4/5] bg-slate-100">
                            <img
                              src={getCoverImage(images, category)}
                              alt={category}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading={category === "weddings" ? "eager" : "lazy"}
                              fetchPriority={category === "weddings" ? "high" : "auto"}
                              decoding="async"
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                              <h3 className="text-white text-lg sm:text-xl font-semibold">
                                {categoryTitleMap[category]}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="sticky top-[70px] sm:top-[92px] z-20 mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur p-2 sm:p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedCategory(null)}
                      className="h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg sm:rounded-xl border border-amber-200 bg-white text-slate-700 hover:bg-amber-100 hover:text-amber-700 shadow-sm"
                      aria-label="Back"
                      title="Back"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>

                    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap pb-1" aria-label="Category switch">
                      {categoryOrder.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={`shrink-0 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-sm border font-medium transition-all duration-200 active:scale-[0.98] ${
                              isActive
                                ? "bg-gradient-to-r from-[#FFD700] to-amber-500 text-slate-900 border-amber-400 shadow-md shadow-amber-300/50"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-sm"
                            }`}
                            aria-label={`Switch to ${categoryTitleMap[category]}`}
                            title={categoryTitleMap[category]}
                          >
                            <span className="sm:hidden">{categoryMobileLabelMap[category]}</span>
                            <span className="hidden sm:inline">{categoryTitleMap[category]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="py-1 sm:py-2">
                  {renderImageGrid(visibleCategoryImages || undefined)}

                  {hasMoreImages && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={loadMoreImages}
                        className="border-amber-300 text-slate-700 hover:bg-amber-50"
                      >
                        Load More Images
                      </Button>
                    </div>
                  )}

                  {hasMoreImages && <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Image Viewer Modal */}
      <Dialog open={currentImageIndex !== null} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent
          className="max-w-7xl w-full h-[92vh] p-0 bg-black/95 border-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {currentImageIndex !== null && currentImageIndex > 0 && (
            <button
              onClick={goToPreviousImage}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {currentImageIndex !== null && categoryImages && currentImageIndex < categoryImages.length - 1 && (
            <button
              onClick={goToNextImage}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {currentImageIndex !== null && categoryImages && (
            <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {currentImageIndex + 1} / {categoryImages.length}
            </div>
          )}

          {currentImage && (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
              <img
                src={currentImage}
                alt="Full size view"
                className="max-w-full max-h-full object-contain select-none"
                decoding="async"
                fetchPriority="high"
                sizes="100vw"
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
