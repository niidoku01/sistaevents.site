import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { collectionAPI } from "@/lib/api";
import { staticCollectionImagesByCategory } from "@/lib/staticCollections";

type Category = "weddings" | "funerals" | "corporate";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "weddings", label: "Weddings & Celebrations" },
  { value: "funerals", label: "Funerals" },
  { value: "corporate", label: "Corporate Events" },
];

const UploadCollection = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<Category>("weddings");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) =>
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)
    );
    if (valid.length !== Array.from(incoming).length) {
      setResult({ type: "error", message: "Some files were skipped (unsupported format). Only JPEG, PNG, GIF & WebP allowed." });
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 20));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await collectionAPI.uploadImages(files, category);
      setResult({ type: "success", message: `${res.images.length} image(s) uploaded successfully to "${CATEGORIES.find((c) => c.value === category)?.label}".` });
      setFiles([]);
    } catch (err: unknown) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const totalStatic =
    staticCollectionImagesByCategory.weddings.length +
    staticCollectionImagesByCategory.funerals.length +
    staticCollectionImagesByCategory.corporate.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Collection Images</CardTitle>
          <CardDescription>Upload new images to the gallery. Images are automatically resized to 1920px and compressed for optimal quality and performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Static count */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            <strong>{totalStatic}</strong> static collection images are already available. Uploaded images will appear in the <strong>Manage</strong> panel.
          </div>

          {/* Category selector */}
          <div className="max-w-xs">
            <Label className="mb-1.5 block text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
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

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground/80">Drop images here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, GIF, WebP &mdash; max 10MB each, up to 10 at once</p>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground/80">{files.length} file(s) selected</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {files.map((f, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border bg-background">
                    <div className="aspect-square">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">{f.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : `Upload to ${CATEGORIES.find((c) => c.value === category)?.label}`}
            </Button>
            {files.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                Clear all
              </Button>
            )}
          </div>

          {/* Result alert */}
          {result && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                result.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {result.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadCollection;
