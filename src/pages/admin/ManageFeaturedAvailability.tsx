import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { images } from "@/lib/imageImports";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, EyeOff, LayoutGrid, RotateCcw } from "lucide-react";
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
  const imageAvailabilityMap = new Map(Object.entries(availabilityState.images));

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const isPhotoVisible = (itemKey: string, imageIndex: number) =>
    imageAvailabilityMap.get(`${itemKey}:${imageIndex}`) ?? true;

  const handleToggle = (key: string, nextValue: boolean) => {
    setLogisticsItemAvailability(key, nextValue);
    setAvailabilityState(getLogisticsAvailability());
    const item = featuredItems.find((entry) => entry.key === key);
    toast({
      title: nextValue ? "Open for bookings" : "Bookings paused",
      description: nextValue ? `${item?.title} is open for bookings again.` : `${item?.title} is paused for now.`,
    });
  };

  const handleImageToggle = (itemKey: string, imageIndex: number, nextValue: boolean) => {
    setLogisticsImageAvailability(itemKey, imageIndex, nextValue);
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: nextValue ? "Photo on display" : "Photo hidden",
      description: nextValue ? "This photo is on display again." : "This photo is now hidden from the showcase.",
    });
  };

  const setAllImages = (itemKey: string, nextValue: boolean) => {
    const item = featuredItems.find((entry) => entry.key === itemKey);
    if (!item) return;
    item.imageUrls.forEach((_, imageIndex) => setLogisticsImageAvailability(itemKey, imageIndex, nextValue));
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: nextValue ? "All photos on display" : "All photos hidden",
      description: nextValue ? `${item.title} is back on the showcase.` : `${item.title} photos are now hidden.`,
    });
  };

  const handleReset = () => {
    resetLogisticsAvailability();
    setAvailabilityState(getLogisticsAvailability());
    toast({
      title: "All set",
      description: "Showcase restored to its default setup.",
    });
  };

  const openCount = featuredItems.filter((item) => availabilityMap.get(item.key) ?? true).length;

  const summary = [
    { icon: LayoutGrid, label: "Collections", value: String(featuredItems.length) },
    { icon: Eye, label: "Open for bookings", value: `${openCount} of ${featuredItems.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Logistics
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Manage logistics availability
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="rounded-xl border-white/60 bg-white/60 text-slate-600 hover:text-amber-700 hover:bg-amber-50/70 hover:border-amber-200/70 font-medium transition-all duration-200 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Restore defaults
        </Button>
      </div>


      {/* Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {featuredItems.map((item) => {
          const isAvailable = availabilityMap.get(item.key) ?? true;
          const isExpanded = !!expandedItems[item.key];
          const primaryImage = item.imageUrls[0];

          return (
            <div
              key={item.key}
              className={cn(
                "overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300",
                isExpanded && "border-amber-200/60"
              )}
            >
              {/* Collection row */}
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                <img
                  src={primaryImage.src}
                  srcSet={primaryImage.srcset}
                  alt={item.title}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-white/60 shadow-sm flex-none"
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</h3>
                  </div>
                  <div className="mt-1.5 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      {isAvailable ? "Open for bookings" : "Bookings paused"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAvailable}
                    onClick={() => handleToggle(item.key, !isAvailable)}
                    aria-label={`${item.title}: open for bookings`}
                    className={cn(
                      "relative inline-flex h-7 min-w-[5.5rem] cursor-pointer items-center rounded-full px-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isAvailable
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-red-400 hover:bg-red-500"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 transition-all duration-300 ease-in-out",
                        isAvailable ? "mr-6 pl-2" : "ml-6 pr-2"
                      )}
                    >
                      {item.category}
                    </span>
                    <span
                      className={cn(
                        "pointer-events-none absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out",
                        isAvailable ? "right-0.5" : "left-0.5"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                          isAvailable ? "bg-emerald-500" : "bg-red-400"
                        )}
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.key)}
                    aria-expanded={isExpanded}
                    aria-label={`${item.title} photo settings`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                  </button>
                </div>
              </div>

              {/* Photo grid */}
              {isExpanded && (
                <div className="border-t border-white/60 bg-slate-50/60 p-4 sm:p-5 animate-[fadeInUp_0.3s_ease]">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Photos on showcase</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAllImages(item.key, true)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Show all
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllImages(item.key, false)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Hide all
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {item.imageUrls.map((imageUrl, imageIndex) => {
                      const imageKey = `${item.key}:${imageIndex}`;
                      const photoVisible = isPhotoVisible(item.key, imageIndex);
                      return (
                        <button
                          key={imageKey}
                          type="button"
                          onClick={() => handleImageToggle(item.key, imageIndex, !photoVisible)}
                          aria-pressed={photoVisible}
                          aria-label={`${item.title} photo ${imageIndex + 1}: ${photoVisible ? "on display" : "hidden"}`}
                          className={cn(
                            "group relative aspect-square overflow-hidden rounded-lg border shadow-sm transition-all duration-200",
                            photoVisible ? "border-white/60 hover:border-amber-300/70" : "border-slate-200/70"
                          )}
                        >
                          <img
                            src={imageUrl.src}
                            srcSet={imageUrl.srcset}
                            alt={`${item.title} — photo ${imageIndex + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                          {!photoVisible && <span className="absolute inset-0 bg-slate-900/50" />}
                          <span
                            className={cn(
                              "absolute left-1.5 bottom-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm",
                              photoVisible ? "bg-emerald-600/90 text-white" : "bg-slate-800/80 text-white"
                            )}
                          >
                            {photoVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {photoVisible ? "On display" : "Hidden"}
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="rounded-lg bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                              {photoVisible ? "Tap to hide" : "Tap to show"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageFeaturedAvailability;