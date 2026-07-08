import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, RefreshCw, ExternalLink, Loader2, X, ArrowUp, ArrowDown, ArrowLeftRight, EyeOff, Eye, RotateCcw } from "lucide-react";
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

  const rerender = () => setVersion((v) => v + 1);

  const fetchUploaded = useCallback(async () => {
    try {
      const data = await collectionAPI.getAllImages();
      const images = Array.isArray(data) ? data : [];
      setUploadedImages(images);
      for (const cat of CATEGORY_ORDER) {
        const ids = images.filter((img) => img.category === cat).map((img) => img._id);
        if (ids.length > 0) ensureImagesInOrder(cat, ids);
      }
    } catch {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Manage Collection</CardTitle>
              <CardDescription>Reorder, hide, or delete collection images. Uploaded images have an orange badge.</CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm">
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reset Order</span>
                <span className="sm:hidden">Reset</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchUploaded(); }} disabled={loading} className="gap-1.5 h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm">
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refr.</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total Images: </span>
              <strong>{allStaticCount + uploadedImages.length}</strong>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">Uploaded: </span>
              <strong>{uploadedImages.length}</strong>
            </div>
          </div>

          {/* Filter */}
          <div className="max-w-xs">
            <Label className="mb-1.5 block text-sm font-medium">Category</Label>
            <Select value={selectedCategory} onValueChange={(v: CollectionCategory | "all") => setSelectedCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All categories - grid view */}
          {!cat ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground/70">All Collection Images</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {CATEGORY_ORDER.flatMap((c) =>
                  combinedByCategory[c].map((img) => (
                    <Card key={img._id} className="overflow-hidden rounded-2xl">
                      <div className="group relative aspect-[4/3] cursor-pointer bg-muted" onClick={() => img.url && setPreview({ url: img.url, name: img.originalName })}>
                        <img src={img.url || ""} alt={img.originalName} className="h-full w-full object-cover transition-opacity group-hover:opacity-90" loading="lazy" decoding="sync" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" width={400} height={300} />
                        <Badge className={`absolute right-2 top-2 ${getCategoryColor(img.category)}`} variant="secondary">
                          {getCategoryLabel(img.category)}
                        </Badge>
                        {"isUploaded" in img && img.isUploaded && (
                          <Badge className="absolute left-2 top-2 bg-amber-500 text-white" variant="secondary">Uploaded</Badge>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                          <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                      <CardContent className="p-2">
                        <p className="truncate text-xs text-muted-foreground">{img.originalName}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : orderedImages.length > 0 ? (
            /* Specific category - list with reorder controls */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70">
                  {getCategoryLabel(cat)} <span className="text-muted-foreground">({orderedImages.length} visible)</span>
                </h3>
              </div>
              <div className="space-y-2">
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
                      className={`flex items-center gap-3 rounded-xl border p-2 transition-all ${
                        isSwapTarget ? "border-accent bg-accent/10 ring-2 ring-accent/30" : "bg-card hover:bg-accent/5"
                      } ${hidden ? "opacity-40" : ""} ${isDragging ? "opacity-30 shadow-inner" : ""} ${
                        isDropOver ? "border-accent/60 bg-accent/10 shadow-md -translate-y-0.5" : ""
                      } ${!hidden ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      <div
                        className="h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-24"
                        onClick={() => img.url && setPreview({ url: img.url, name: img.originalName })}
                      >
                        <img src={img.url || ""} alt={img.originalName} className="h-full w-full object-cover" loading="lazy" decoding="sync" sizes="80px" width={160} height={120} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium sm:text-sm">{img.originalName}</p>
                          {isUploaded && (
                            <Badge className="shrink-0 bg-amber-500 text-white text-[9px] px-1.5 py-0" variant="secondary">Uploaded</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground sm:text-xs">#{idx + 1}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveUp(idx)} disabled={idx === 0} title="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveDown(idx)} disabled={idx >= orderedImages.length - 1} title="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSwapClick(img._id)} title={swapMode ? "Swap with this" : "Select to swap"}>
                          <ArrowLeftRight className={`h-3.5 w-3.5 ${swapMode && !isSwapTarget ? "text-accent" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleHide(img._id)} title={hidden ? "Show" : "Hide"}>
                          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        {isUploaded && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(img._id, img.category)}
                            disabled={deleting === img._id}
                            title="Delete uploaded image"
                          >
                            {deleting === img._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-muted-foreground">
              <ImageIcon className="mb-2 h-8 w-8" />
              <p className="text-sm">All images in this category are hidden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-lg">
              <X className="h-4 w-4" />
            </button>
            <img src={preview.url} alt={preview.name} className="max-h-[85vh] rounded-xl object-contain shadow-2xl" decoding="sync" fetchPriority="high" />
            <p className="mt-2 text-center text-sm text-white/80">{preview.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCollection;
