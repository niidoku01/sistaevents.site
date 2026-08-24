import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, RefreshCw, ExternalLink, Loader2, X, ArrowUp, ArrowDown, ArrowLeftRight, EyeOff, Eye, RotateCcw, FolderOpen, Upload, Sparkles } from "lucide-react";
import { collectionAPI } from "@/lib/api";
import { staticCollectionImagesByCategory, type CollectionCategory, type StaticCollectionImage } from "@/lib/staticCollections";
import { getOrderedImages, getOrderRaw, ensureImagesInOrder, moveImage, swapImages, toggleHidden, isHidden, removeFromOrder, resetOrder } from "@/lib/collectionOrder";

interface UploadedImage {
  _id: string;
  storageId: string;
  originalName: string;
  size: number;
  contentType: string;
  category: string;
  uploadedAt: number;
  url: string | null;
}

type DisplayImage = (StaticCollectionImage | UploadedImage) & {
  _id: string;
  originalName: string;
  url: string | null;
  srcset?: string;
  category: string;
  isUploaded?: boolean;
};

const CATEGORIES: { value: CollectionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "weddings", label: "Weddings & Celebrations" },
  { value: "funerals", label: "Funerals" },
  { value: "corporate", label: "Corporate Events" },
];

const CATEGORY_ORDER: CollectionCategory[] = ["weddings", "funerals", "corporate"];

const ManageCollection = () => {
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | "all">("all");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [swapMode, setSwapMode] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const rerender = () => setVersion((v) => v + 1);

  const fetchUploaded = useCallback(async () => {
    try {
      setFetchError(null);
      const data = await collectionAPI.getAllImages();
      const images = Array.isArray(data) ? data : [];
      setUploadedImages(images);
      for (const cat of CATEGORY_ORDER) {
        const ids = images.filter((img) => img.category === cat).map((img) => img._id);
        if (ids.length > 0) ensureImagesInOrder(cat, ids);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch collection images:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to load images");
      setUploadedImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploaded();
  }, [fetchUploaded]);

  const cat = selectedCategory !== "all" ? selectedCategory : null;

  const combinedByCategory: Record<CollectionCategory, DisplayImage[]> = React.useMemo(() => {
    const result: Record<CollectionCategory, DisplayImage[]> = {
      weddings: [],
      funerals: [],
      corporate: [],
    };
    for (const category of CATEGORY_ORDER) {
      const staticImages: DisplayImage[] = staticCollectionImagesByCategory[category].map((img) => ({
        ...img,
        isUploaded: false,
      }));
      const uploaded: DisplayImage[] = uploadedImages
        .filter((img) => img.category === category)
        .map((img) => ({
          ...img,
          url: img.url,
          isUploaded: true,
        }));
      result[category] = [...staticImages, ...uploaded];
    }
    return result;
  }, [uploadedImages]);

  const rawOrder = cat ? getOrderRaw()[cat] : [];

  const orderedImages: DisplayImage[] = cat
    ? getOrderedImages(cat, combinedByCategory[cat])
    : [];

  const allStaticCount = Object.values(staticCollectionImagesByCategory).flat().length;

  const handleDelete = async (id: string, category: string) => {
    if (!confirm("Delete this uploaded image? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await collectionAPI.deleteImage(id);
      removeFromOrder(category as CollectionCategory, id);
      setUploadedImages((prev) => prev.filter((img) => img._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveUp = (idx: number) => {
    if (!cat || idx <= 0) return;
    moveImage(cat, idx, idx - 1);
    rerender();
  };

  const handleMoveDown = (idx: number) => {
    if (!cat || idx >= rawOrder.length - 1) return;
    moveImage(cat, idx, idx + 1);
    rerender();
  };

  const handleSwapClick = (id: string) => {
    if (swapMode === id) {
      setSwapMode(null);
      return;
    }
    if (swapMode) {
      if (!cat) return;
      const idxA = rawOrder.findIndex((e) => e.id === swapMode);
      const idxB = rawOrder.findIndex((e) => e.id === id);
      if (idxA >= 0 && idxB >= 0) {
        swapImages(cat, idxA, idxB);
      }
      setSwapMode(null);
      rerender();
    } else {
      setSwapMode(id);
    }
  };

  const handleToggleHide = (id: string) => {
    if (!cat) return;
    toggleHidden(cat, id);
    rerender();
  };

  const handleReset = () => {
    if (!confirm("Reset all images to default order and show all?")) return;
    resetOrder();
    rerender();
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "weddings": return "bg-pink-100 text-pink-800";
      case "funerals": return "bg-gray-100 text-gray-800";
      case "corporate": return "bg-blue-100 text-blue-800";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="overflow-hidden border-white/50 bg-white/60 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-6 w-48 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer" />
                <div className="h-4 w-36 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <div className="h-10 w-36 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
              <div className="h-10 w-28 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
            </div>
            <div className="h-10 w-52 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/40 bg-white/50">
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
                  <div className="p-2 space-y-1.5">
                    <div className="h-3 w-full rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden animate-fade-in">
      {/* Main card */}
      <Card className="overflow-hidden border-white/50 bg-white/60 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <CardHeader className="border-b border-white/30 bg-gradient-to-r from-white/40 via-white/20 to-white/40">
          <div className="flex items-center justify-between overflow-hidden">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                Manage Collection
              </CardTitle>
              <CardDescription className="truncate text-xs sm:text-sm">Reorder, hide, or delete images across categories.</CardDescription>
            </div>
            <div className="flex shrink-0 gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 px-2 sm:px-3 rounded-xl border-white/60 bg-white/50 backdrop-blur-md hover:bg-white/70 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95">
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset Order</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchUploaded(); }} disabled={loading} className="gap-1.5 px-2 sm:px-3 rounded-xl border-white/60 bg-white/50 backdrop-blur-md hover:bg-white/70 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-hidden pt-6">
          {/* Summary stats */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/50 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md px-4 py-2.5 text-sm shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/20">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
                <strong className="text-base font-bold tabular-nums">{allStaticCount + uploadedImages.length}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/50 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md px-4 py-2.5 text-sm shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/20">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Uploaded</p>
                <strong className="text-base font-bold tabular-nums">{uploadedImages.length}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/50 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md px-4 py-2.5 text-sm shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Categories</p>
                <strong className="text-base font-bold tabular-nums">{CATEGORY_ORDER.length}</strong>
              </div>
            </div>
          </div>

          {/* Fetch error */}
          {fetchError && (
            <div className="rounded-xl border border-red-200/60 bg-gradient-to-r from-red-50 to-red-100/50 p-3 text-sm text-red-800 shadow-sm backdrop-blur-sm">
              <strong>Failed to load images:</strong> {fetchError}
            </div>
          )}

          {/* Filter */}
          <div className="max-w-xs">
            <Label className="mb-1.5 block text-sm font-medium">Category</Label>
            <Select value={selectedCategory} onValueChange={(v: CollectionCategory | "all") => setSelectedCategory(v)}>
              <SelectTrigger className="rounded-xl border-white/60 bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200 hover:bg-white/70 focus:ring-2 focus:ring-amber-400/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl shadow-xl">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All categories - grid view */}
          {!cat ? (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground/70 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                All Collection Images
              </h3>
              <div className="grid grid-cols-2 gap-3 overflow-hidden sm:grid-cols-3 sm:gap-4 md:grid-cols-4" data-reveal-stagger>
                {CATEGORY_ORDER.flatMap((c) =>
                  combinedByCategory[c].map((img, i) => (
                    <div
                      key={img._id}
                      data-reveal
                      style={{ "--reveal-delay": `${Math.min(i * 50, 400)}ms` } as React.CSSProperties}
                      className="group overflow-hidden rounded-2xl border border-white/40 bg-white/50 backdrop-blur-md shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] is-visible"
                    >
                      <div
                        className="group relative aspect-[4/3] cursor-pointer bg-muted overflow-hidden"
                        onClick={() => img.url && setPreview({ url: img.url, name: img.originalName })}
                      >
                        <img
                          src={img.url || ""}
                          srcSet={img.srcset}
                          alt={img.originalName}
                          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          width={400}
                          height={300}
                        />
                        <Badge className={`absolute right-2 top-2 shadow-sm ${getCategoryColor(img.category)}`} variant="secondary">
                          {getCategoryLabel(img.category)}
                        </Badge>
                        {"isUploaded" in img && img.isUploaded && (
                          <Badge className="absolute left-2 top-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm" variant="secondary">Uploaded</Badge>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 scale-75 transition-all duration-300 group-hover:scale-100">
                            <ExternalLink className="h-4 w-4 text-white drop-shadow" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-2.5">
                        <p className="truncate text-xs font-medium text-slate-700">{img.originalName}</p>
                      </CardContent>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : orderedImages.length > 0 ? (
            /* Specific category - list with reorder controls */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)] ${
                    cat === "weddings" ? "bg-pink-400 shadow-[0_0_6px_rgba(244,114,182,0.6)]" :
                    cat === "funerals" ? "bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.6)]" :
                    "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]"
                  }`} />
                  {getCategoryLabel(cat)}
                  <span className="text-muted-foreground font-normal">({orderedImages.length} visible)</span>
                </h3>
              </div>
              <div className="space-y-2 overflow-hidden">
                {orderedImages.map((img, idx) => {
                  const hidden = isHidden(img.category as CollectionCategory, img._id);
                  const isUploaded = "isUploaded" in img && img.isUploaded;
                  const isSwapTarget = swapMode === img._id;
                  const isDragging = dragIdx === idx;
                  const isDropOver = dropTarget === idx;
                  return (
                    <div
                      key={img._id}
                      draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDropTarget(idx); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIdx !== null && dragIdx !== idx && cat) {
                          moveImage(cat, dragIdx, idx);
                          rerender();
                        }
                        setDragIdx(null);
                        setDropTarget(null);
                      }}
                      onDragEnd={() => { setDragIdx(null); setDropTarget(null); }}
                      className={`flex items-center gap-2 overflow-hidden rounded-xl border p-1.5 sm:p-2 transition-all duration-200 ${
                        isSwapTarget
                          ? "border-amber-400/60 bg-gradient-to-r from-amber-50/80 to-amber-100/40 ring-2 ring-amber-400/30 shadow-md shadow-amber-200/30"
                          : "border-white/40 bg-white/50 backdrop-blur-md hover:bg-white/70 hover:shadow-md hover:shadow-slate-100/50 hover:-translate-y-px"
                      } ${hidden ? "opacity-40" : ""} ${isDragging ? "opacity-30 shadow-inner scale-[0.98]" : ""} ${
                        isDropOver ? "border-amber-400/60 bg-amber-50/50 shadow-lg -translate-y-0.5 scale-[1.01]" : ""
                      } ${!hidden ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      <div
                        className="h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-24 shadow-sm ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-md"
                        onClick={() => img.url && setPreview({ url: img.url, name: img.originalName })}
                      >
                        <img src={img.url || ""} srcSet={img.srcset} alt={img.originalName} className="h-full w-full object-cover transition-transform duration-300 hover:scale-110" loading="lazy" decoding="async" fetchPriority="low" sizes="80px" width={160} height={120} />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium sm:text-sm">{img.originalName}</p>
                          {isUploaded && (
                            <Badge className="shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] px-1.5 py-0 shadow-sm" variant="secondary">Uploaded</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground sm:text-xs tabular-nums">#{idx + 1}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg transition-all duration-200 hover:bg-slate-100 hover:shadow-sm active:scale-90" onClick={() => handleMoveUp(idx)} disabled={idx === 0} title="Move up">
                          <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg transition-all duration-200 hover:bg-slate-100 hover:shadow-sm active:scale-90" onClick={() => handleMoveDown(idx)} disabled={idx >= orderedImages.length - 1} title="Move down">
                          <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-90 ${swapMode && !isSwapTarget ? "text-amber-500 bg-amber-50" : "hover:bg-slate-100"}`} onClick={() => handleSwapClick(img._id)} title={swapMode ? "Swap with this" : "Select to swap"}>
                          <ArrowLeftRight className={`h-3 w-3 sm:h-3.5 sm:w-3.5`} />
                        </Button>
                        <Button variant="ghost" size="icon" className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-90 ${hidden ? "text-emerald-500 hover:bg-emerald-50" : "hover:bg-slate-100"}`} onClick={() => handleToggleHide(img._id)} title={hidden ? "Show" : "Hide"}>
                          {hidden ? <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        </Button>
                        {isUploaded && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200 active:scale-90"
                            onClick={() => handleDelete(img._id, img.category)}
                            disabled={deleting === img._id}
                            title="Delete uploaded image"
                          >
                            {deleting === img._id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/60 py-12 text-muted-foreground bg-gradient-to-b from-slate-50/50 to-transparent">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 mb-3 shadow-sm">
                <ImageIcon className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium">All images in this category are hidden</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Use the eye icon to show them again</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in" onClick={() => setPreview(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw] animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/60 transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[85vh] rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
            />
            <p className="mt-3 text-center text-sm font-medium text-white/80 backdrop-blur-sm bg-white/10 rounded-lg px-3 py-1.5 inline-block w-full max-w-md mx-auto">{preview.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCollection;
