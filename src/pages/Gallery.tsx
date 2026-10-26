import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getOrderedImages, ensureImagesInOrder, applyServerLayout } from "../lib/collectionOrder";
import { staticCollectionImagesByCategory } from "@/lib/staticCollections";
import { type CachedGalleryImage, readCachedGalleryImages, writeCachedGalleryImages } from "@/lib/galleryCache";
import { preloadImage, preloadImages } from "@/lib/imagePreload";

type Category = "weddings" | "funerals" | "corporate";

const categoryOrder: Category[] = ["weddings", "funerals", "corporate"];

const categoryTitleMap: Record<Category, string> = {
  weddings: "Weddings / Celebrations",
  funerals: "Funerals",
  corporate: "Corporate",
};

const categoryMobileLabelMap: Record<Category, string> = {
  weddings: "Weddings",
  funerals: "Funerals",
  corporate: "Corporate",
};

type CollectionImage = {
  _id: string;
  url: string | null;
  srcset?: string;
  width?: number;
  height?: number;
  originalName: string;
  category: string;
};

// Matches the masonry column counts below so the browser requests the right
// variant instead of guessing and over-fetching large files.
const GRID_SIZES = "(min-width: 1536px) 24vw, (min-width: 1280px) 32vw, 49vw";
const COVER_SIZES = "(max-width: 640px) 100vw, 33vw";
const LIGHTBOX_SIZES = "100vw";
const PRIORITY_GRID_IMAGES = 4;
const EAGER_GRID_IMAGES = 12;
const INITIAL_VISIBLE_IMAGES = 12;
const LOAD_MORE_STEP = 12;

const PLACEHOLDER = "https://via.placeholder.com/800x600?text=No+Images";

// Helper function to get cover image for a category
const getCoverImage = (
  images: CollectionImage[] | undefined,
  category?: Category
): { url: string; srcset?: string; width?: number; height?: number } => {
  if (!images || images.length === 0) return { url: PLACEHOLDER };

  // Use last image for corporate, first for others
  const img = category === "corporate" ? images[images.length - 1] : images[0];
  return {
    url: img?.url || PLACEHOLDER,
    srcset: img?.srcset,
    width: img?.width,
    height: img?.height,
  };
};

type GridTileProps = {
  image: CollectionImage;
  index: number;
  onOpen: (index: number) => void;
};

/**
 * One masonry cell with its own load state. Keeping this state local means a
 * finished image download only re-renders its own tile instead of the whole
 * gallery (which used to happen for every single image).
 */
const GridTile = React.memo(function GridTile({ image, index, onOpen }: GridTileProps) {
  const [loaded, setLoaded] = useState(false);
  const isPriority = index < PRIORITY_GRID_IMAGES;
  const isEager = index < EAGER_GRID_IMAGES;
  const label = image.originalName || `image ${index + 1}`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer break-inside-avoid"
      tabIndex={0}
      role="button"
      aria-label={`View ${label}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(index);
        }
      }}
      onClick={() => onOpen(index)}
      style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}
    >
      <div
        className={`relative ${loaded ? "bg-transparent" : "bg-slate-200/80 animate-pulse"}`}
        aria-hidden={!loaded}
      >
        <img
          src={image.url || ""}
          srcSet={image.srcset}
          alt={label}
          className={`w-full h-auto object-cover group-hover:scale-105 relative z-10 transition-all duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          loading={isEager ? "eager" : "lazy"}
          fetchpriority={isPriority ? "high" : "auto"}
          decoding="async"
          sizes={GRID_SIZES}
          width={image.width}
          height={image.height}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 z-0 rounded-2xl bg-linear-to-br from-slate-100 via-slate-200 to-slate-100/60" />
        )}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2.5 shadow-lg">
            <ZoomIn className="w-[18px] h-[18px] text-slate-700" />
          </span>
        </div>
      </div>
    </div>
  );
});

export default function OurCollection() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_IMAGES);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [barMinimized, setBarMinimized] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [currentImageLoaded, setCurrentImageLoaded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Seed the gallery from the last snapshot so the first paint already includes
  // uploaded photos. The live Convex query below revalidates it and keeps the
  // snapshot fresh; because the query is prewarmed in App, it is normally
  // already cached by the time this page mounts.
  const [cachedImages] = useState<CachedGalleryImage[]>(readCachedGalleryImages);
  const liveImages = useQuery(api.collectionImages.listImages);
  const liveLayout = useQuery(api.collectionLayout.getLayout);
  const uploadedImages = liveImages ?? cachedImages;

  const markImageLoaded = useCallback((key: string) => {
    setLoadedImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  useEffect(() => {
    setCurrentImageLoaded(false);
  }, [currentImageIndex]);

  // Apply the shared admin layout whenever the live query changes. The helper
  // also persists it, so the correct order is used on the next cold start.
  useEffect(() => {
    if (!liveLayout) return;
    applyServerLayout(liveLayout);
    setLayoutVersion((v) => v + 1);
  }, [liveLayout]);

  // Persist the latest image list and add any new ids to the saved order in one
  // pass, then recompute the ordered lists.
  useEffect(() => {
    if (liveImages) {
      writeCachedGalleryImages(liveImages);
    }
    for (const cat of categoryOrder) {
      const ids = uploadedImages.filter((img) => img.category === cat).map((img) => img._id);
      if (ids.length > 0) ensureImagesInOrder(cat, ids);
    }
    setLayoutVersion((v) => v + 1);
  }, [liveImages, uploadedImages]);

  const combinedByCategory: Record<Category, CollectionImage[]> = React.useMemo(() => {
    const result: Record<Category, CollectionImage[]> = {
      weddings: [],
      funerals: [],
      corporate: [],
    };
    for (const category of categoryOrder) {
      const staticImages: CollectionImage[] = staticCollectionImagesByCategory[category].map((img) => ({
        _id: img._id,
        url: img.url,
        srcset: img.srcset,
        width: img.width,
        height: img.height,
        originalName: img.originalName,
        category: img.category,
      }));
      const uploaded: CollectionImage[] = uploadedImages
        .filter((img) => img.category === category)
        .map((img) => ({
          _id: img._id,
          url: img.url,
          srcset: img.srcset ?? undefined,
          width: img.width ?? undefined,
          height: img.height ?? undefined,
          originalName: img.originalName,
          category: img.category,
        }));
      result[category] = [...staticImages, ...uploaded];
    }
    return result;
  }, [uploadedImages]);

  const imagesByCategory: Record<Category, CollectionImage[]> = React.useMemo(() => {
    const result: Record<Category, CollectionImage[]> = {
      weddings: [],
      funerals: [],
      corporate: [],
    };
    for (const category of categoryOrder) {
      result[category] = getOrderedImages(category, combinedByCategory[category]);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedByCategory, layoutVersion]);

  // Warm the first cover while the rest of the page hydrates. This is the LCP
  // image on the collection landing view.
  useEffect(() => {
    const cover = getCoverImage(imagesByCategory.weddings, "weddings");
    preloadImage({ src: cover.url, srcset: cover.srcset }, COVER_SIZES);
  }, [imagesByCategory]);

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

  const currentImageSrcset = currentImageIndex !== null && categoryImages && categoryImages[currentImageIndex]
    ? categoryImages[currentImageIndex].srcset
    : undefined;

  // The viewer opens instantly if the current and adjacent full-size images are
  // already in the HTTP cache. Loading two neighbours keeps swipe/arrow
  // navigation snappy without fetching the whole collection.
  useEffect(() => {
    if (currentImageIndex === null || !categoryImages) return;
    preloadImages(
      [
        categoryImages[currentImageIndex - 1],
        categoryImages[currentImageIndex],
        categoryImages[currentImageIndex + 1],
      ],
      LIGHTBOX_SIZES
    );
  }, [currentImageIndex, categoryImages]);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Navigation functions
  const goToNextImage = useCallback(() => {
    if (currentImageIndex !== null && categoryImages && currentImageIndex < categoryImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [currentImageIndex, categoryImages]);

  const goToPreviousImage = useCallback(() => {
    if (currentImageIndex !== null && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  const closeViewer = useCallback(() => {
    setCurrentImageIndex(null);
  }, []);

  const openImage = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // Warm a few grid thumbnails as soon as the visitor shows intent to open a
  // category (hover/focus on desktop, touch start on mobile). Because the grid
  // uses responsive srcsets, this is a handful of small WebP files.
  const preloadCategoryPreview = useCallback(
    (category: Category) => {
      const images = imagesByCategory[category];
      if (!images || images.length === 0) return;
      preloadImages(images.slice(0, 3), GRID_SIZES);
    },
    [imagesByCategory]
  );

  const loadMoreImages = useCallback(() => {
    if (!categoryImages) {
      return;
    }

    setVisibleCount((previous) => Math.min(previous + LOAD_MORE_STEP, categoryImages.length));
  }, [categoryImages]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    setVisibleCount(INITIAL_VISIBLE_IMAGES);
  }, [selectedCategory]);

  useEffect(() => {
    const onScroll = () => setBarMinimized(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
  }, [selectedCategory, hasMoreImages, visibleCount, categoryImages, loadMoreImages]);

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
  }, [currentImageIndex, categoryImages, goToNextImage, goToPreviousImage, closeViewer]);

  // Touch handlers for swipe with smooth tracking
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    setSwipeOffset(currentX - touchStart);
  };

  const onTouchEnd = () => {
    setIsSwiping(false);
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextImage();
    } else if (isRightSwipe) {
      goToPreviousImage();
    }
    setSwipeOffset(0);
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
      <div className="columns-2 gap-3 sm:gap-5 space-y-3 sm:space-y-5 xl:columns-3 2xl:columns-4">
        {images.map((img, i) => (
          <GridTile key={img._id || i} image={img} index={i} onOpen={openImage} />
        ))}
      </div>
    );
  };

  return (

    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-br from-amber-50 via-white to-sky-50 px-6 sm:px-8 py-8 sm:py-10 mb-8 sm:mb-10">
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />

              <div className="relative">
                <h1 className="text-1xl sm:text-2xl md:text-3xl font-bold bg-linear-to-r from-[#FFD700] to-amber-500 bg-clip-text text-transparent tracking-tight">OUR COLLECTION</h1>
                <p className="mt-2 text-sm sm:text-base text-slate-700">Gallery Experience</p>
              </div>
            </div>

            {!selectedCategory ? (
              <div>
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 max-w-6xl mx-auto">
                  {categoryOrder.map((category) => {
                    const images = imagesByCategory[category];
                    const cover = getCoverImage(images, category);
                    const isLoaded = loadedImages[`cover-${category}`];
                    return (
                      <button
                        key={category}
                        type="button"
                        className="group text-left w-full sm:flex-1 sm:min-w-0"
                        onClick={() => setSelectedCategory(category)}
                        onPointerEnter={() => preloadCategoryPreview(category)}
                        onFocus={() => preloadCategoryPreview(category)}
                        onTouchStart={() => preloadCategoryPreview(category)}
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white shadow-xs hover:shadow-2xl transition-all duration-300 ring-1 ring-black/5">
                          <div className={`bg-slate-200/80 ${isLoaded ? "" : "animate-pulse"}`}>
                            <img
                              src={cover.url}
                              srcSet={cover.srcset}
                              alt={categoryTitleMap[category]}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                              loading={category === "weddings" ? "eager" : "lazy"}
                              fetchpriority={category === "weddings" ? "high" : "auto"}
                              decoding="async"
                              sizes={COVER_SIZES}
                              width={cover.width}
                              height={cover.height}
                              onLoad={() => markImageLoaded(`cover-${category}`)}
                              onError={() => markImageLoaded(`cover-${category}`)}
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10" />
                            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                              <h3 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
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
                <div className="sticky top-[70px] sm:top-[92px] z-20 mb-4 sm:mb-6">
                  <div
                    className={`relative rounded-xl sm:rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl backdrop-saturate-150 p-2 sm:p-4 shadow-lg shadow-slate-900/10 transition-all duration-500 ease-out origin-center ${
                      barMinimized ? "opacity-0 scale-90 -translate-y-3 pointer-events-none" : "opacity-100 scale-100 translate-y-0"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedCategory(null)}
                        className="h-9 w-9 sm:h-11 sm:w-11 p-0 rounded-lg sm:rounded-xl border border-amber-200 bg-white text-slate-700 hover:bg-amber-100 hover:text-amber-700 shadow-xs"
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
                              className={`shrink-0 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-sm border font-medium transition-all duration-200 active:scale-95 ${
                                isActive
                                  ? "bg-linear-to-r from-[#FFD700] to-amber-500 text-slate-900 border-amber-400 shadow-md shadow-amber-300/50"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-xs"
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

                  <div
                    className={`fixed z-40 right-2 sm:right-4 transition-all duration-500 ease-out ${
                      barMinimized
                        ? "top-[70px] sm:top-4 opacity-100 scale-100 translate-x-0 translate-y-0"
                        : "top-4 opacity-0 scale-75 -translate-x-[20vw] translate-y-1 pointer-events-none"
                    }`}
                  >
                    <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/50 bg-white/80 backdrop-blur-xl backdrop-saturate-150 py-1.5 pl-1.5 pr-1 sm:pr-1.5 shadow-lg shadow-slate-900/10">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedCategory(null)}
                        className="h-8 w-8 shrink-0 rounded-full border border-amber-200 bg-white text-slate-700 hover:bg-amber-100 hover:text-amber-700 shadow-xs"
                        aria-label="Back"
                        title="Back"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {categoryOrder.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all duration-200 active:scale-95 border ${
                              isActive
                                ? "bg-linear-to-r from-[#FFD700] to-amber-500 text-slate-900 border-amber-400 shadow-md shadow-amber-300/50"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-xs"
                            }`}
                            aria-label={`Switch to ${categoryTitleMap[category]}`}
                            title={categoryTitleMap[category]}
                          >
                            {categoryMobileLabelMap[category]}
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
      </main>

      {/* Image Viewer Modal */}
      <Dialog open={currentImageIndex !== null} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent
          className="max-w-7xl w-full vh-92 h-[92dvh] p-0 bg-black/95 border-none overflow-hidden"
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
            <div
              className="w-full h-full flex items-center justify-center p-4 sm:p-6 relative"
              style={{
                transform: isSwiping ? `translateX(${swipeOffset * 0.4}px)` : "translateX(0)",
                transition: isSwiping ? "none" : "transform 0.3s ease-out",
              }}
            >
              {!currentImageLoaded && (
                <div className="absolute inset-0 bg-slate-800/80 animate-pulse" aria-hidden="true" />
              )}
              <img
                src={currentImage}
                srcSet={currentImageSrcset}
                alt={currentImageIndex !== null && categoryImages ? categoryImages[currentImageIndex]?.originalName || "Full size view" : "Full size view"}
                className={`lightbox-img max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${currentImageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="eager"
                decoding="async"
                fetchpriority="high"
                sizes={LIGHTBOX_SIZES}
                width={currentImageIndex !== null ? categoryImages?.[currentImageIndex]?.width : undefined}
                height={currentImageIndex !== null ? categoryImages?.[currentImageIndex]?.height : undefined}
                draggable={false}
                onLoad={() => setCurrentImageLoaded(true)}
                onError={() => setCurrentImageLoaded(true)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WhatsAppButton phoneNumber="+233279689522" />
      <BackToTop />
      <Footer />
    </div>
  );
}
