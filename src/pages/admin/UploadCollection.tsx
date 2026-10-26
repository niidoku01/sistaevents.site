import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import {
  collectionAPI,
  type UploadFileStatus,
  type UploadProgressState,
} from "@/lib/api";

type Category = "weddings" | "funerals" | "corporate";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "weddings", label: "Weddings & Celebrations" },
  { value: "funerals", label: "Funerals" },
  { value: "corporate", label: "Corporate Events" },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

let selectionCounter = 0;
const nextSelectionId = () => `selection-${++selectionCounter}`;

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const ProgressRing = ({
  percent,
  complete,
  failed,
}: {
  percent: number;
  complete: boolean;
  failed: boolean;
}) => {
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const color = failed ? "#ef4444" : complete ? "#22c55e" : "#f59e0b";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={complete ? "Upload complete" : failed ? "Upload finished with errors" : "Upload in progress"}
      className="relative h-10 w-10 shrink-0"
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-10 w-10 -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset,stroke] duration-300 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-foreground">
        {Math.round(clamped)}%
      </span>
    </div>
  );
};

type PreviewTileProps = {
  item: SelectedFile;
  index: number;
  status?: UploadFileStatus;
  percent: number;
  locked: boolean;
  onRemove: (id: string) => void;
};

const PreviewTile = React.memo(function PreviewTile({
  item,
  index,
  status,
  percent,
  locked,
  onRemove,
}: PreviewTileProps) {
  const shownPercent = status === "done" || status === "failed" ? 100 : status === "uploading" ? percent : 0;
  const statusLabel =
    status === "done"
      ? "Uploaded"
      : status === "failed"
        ? "Failed"
        : status === "uploading"
          ? `${Math.round(percent)}%`
          : status === "queued"
            ? "Queued"
            : null;

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="relative aspect-square">
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-full w-full object-cover"
          decoding="async"
          loading="lazy"
        />

        {status && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white transition-colors duration-200 ${
              status === "done"
                ? "bg-green-950/55"
                : status === "failed"
                  ? "bg-red-950/60"
                  : status === "uploading"
                    ? "bg-black/45"
                    : "bg-black/30"
            }`}
          >
            {status === "done" ? (
              <CheckCircle2 className="h-7 w-7 text-green-300" />
            ) : status === "failed" ? (
              <AlertCircle className="h-7 w-7 text-red-300" />
            ) : status === "uploading" ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-[11px] font-semibold tabular-nums">{Math.round(percent)}%</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-white/80" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/80">Queued</span>
              </>
            )}
          </div>
        )}

        {!locked && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
          <div
            className={`h-full transition-[width,background-color] duration-300 ease-out ${
              status === "failed" ? "bg-red-400" : status === "done" ? "bg-green-400" : "bg-amber-300"
            }`}
            style={{ width: `${shownPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="min-w-0 truncate text-[11px] text-muted-foreground" title={item.file.name}>
          {index + 1}. {item.file.name}
        </span>
        {statusLabel && (
          <span
            className={`shrink-0 text-[10px] font-semibold ${
              status === "done"
                ? "text-green-600"
                : status === "failed"
                  ? "text-red-600"
                  : status === "uploading"
                    ? "text-amber-600"
                    : "text-muted-foreground"
            }`}
          >
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
});

const UploadCollection = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [category, setCategory] = useState<Category>("weddings");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneTimeoutRef = useRef<number | null>(null);
  const filesRef = useRef<SelectedFile[]>([]);
  const lastBatchRef = useRef<SelectedFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ _id: string; category: string }[] | null>(null);

  const commitFiles = useCallback((next: SelectedFile[]) => {
    filesRef.current = next;
    setSelectedFiles(next);
  }, []);

  const clearDoneTimer = useCallback(() => {
    if (doneTimeoutRef.current !== null) {
      window.clearTimeout(doneTimeoutRef.current);
      doneTimeoutRef.current = null;
    }
  }, []);

  const fetchUploadedImages = useCallback(async () => {
    try {
      const data = await collectionAPI.getAllImages();
      setUploadedImages(Array.isArray(data) ? data : []);
    } catch {
      setUploadedImages(null);
    }
  }, []);

  useEffect(() => {
    fetchUploadedImages();
  }, [fetchUploadedImages]);

  useEffect(() => {
    return () => {
      clearDoneTimer();
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      filesRef.current = [];
    };
  }, [clearDoneTimer]);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const selected = Array.from(incoming);
      const valid = selected.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
      const current = filesRef.current;
      const keys = new Set(current.map((item) => fileKey(item.file)));
      const next = [...current];
      let duplicates = 0;
      let overflow = 0;

      for (const file of valid) {
        const key = fileKey(file);
        if (keys.has(key)) {
          duplicates += 1;
          continue;
        }
        if (next.length >= MAX_FILES) {
          overflow += 1;
          continue;
        }
        keys.add(key);
        next.push({
          id: nextSelectionId(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      if (next.length > current.length) {
        clearDoneTimer();
        setProgress(null);
        commitFiles(next);
        setResult(null);
      }

      const skipped = selected.length - valid.length;
      if (skipped > 0) {
        setResult({
          type: "error",
          message: `Skipped ${skipped} file${skipped === 1 ? "" : "s"}. Use JPEG, PNG, GIF, or WebP under 10MB.`,
        });
      } else if (duplicates > 0) {
        setResult({
          type: "error",
          message: `${duplicates} image${duplicates === 1 ? " was" : "s were"} already selected.`,
        });
      } else if (overflow > 0) {
        setResult({
          type: "error",
          message: `You can upload up to ${MAX_FILES} images at a time. ${overflow} file${overflow === 1 ? " was" : "s were"} not added.`,
        });
      }
    },
    [clearDoneTimer, commitFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (uploading) return;
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, uploading]
  );

  const removeFile = useCallback(
    (id: string) => {
      const current = filesRef.current;
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      clearDoneTimer();
      setProgress(null);
      commitFiles(current.filter((item) => item.id !== id));
    },
    [clearDoneTimer, commitFiles]
  );

  const clearFiles = useCallback(() => {
    clearDoneTimer();
    filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    lastBatchRef.current = [];
    commitFiles([]);
    setProgress(null);
  }, [clearDoneTimer, commitFiles]);

  const handleUpload = async (batchOverride?: SelectedFile[]) => {
    const batch = batchOverride ?? filesRef.current;
    if (batch.length === 0 || uploading) return;

    lastBatchRef.current = batch;
    clearDoneTimer();
    setUploading(true);
    setResult(null);
    setProgress({
      totalFiles: batch.length,
      completedFiles: 0,
      failedFiles: 0,
      percent: 0,
      currentFile: null,
      files: batch.map((item) => ({
        name: item.file.name,
        status: "queued" as const,
        percent: 0,
        size: item.file.size,
      })),
    });

    try {
      const res = await collectionAPI.uploadImages(
        batch.map((item) => item.file),
        category,
        (state) => setProgress(state)
      );
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              percent: 100,
              completedFiles: prev.totalFiles,
              failedFiles: 0,
              currentFile: null,
              files: prev.files.map((file) => ({ ...file, status: "done" as const, percent: 100 })),
            }
          : prev
      );
      setResult({
        type: "success",
        message: `${res.images.length} image${res.images.length === 1 ? "" : "s"} uploaded successfully to "${CATEGORIES.find((c) => c.value === category)?.label}".`,
      });
      fetchUploadedImages();
      doneTimeoutRef.current = window.setTimeout(() => {
        setProgress(null);
        lastBatchRef.current = [];
        filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        commitFiles([]);
        doneTimeoutRef.current = null;
      }, 3000);
    } catch (err: unknown) {
      // Keep the per-file progress so failed tiles stay visible for a retry.
      setResult({ type: "error", message: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const retryFailedUploads = () => {
    const batch = lastBatchRef.current;
    if (!progress || batch.length === 0) return;

    const failedFiles = batch.filter(
      (item, index) => progress.files[index]?.status === "failed"
    );
    if (failedFiles.length === 0) return;

    const failedIds = new Set(failedFiles.map((item) => item.id));
    const batchIds = new Set(batch.map((item) => item.id));
    const current = filesRef.current;
    // Keep newly added files and only the failed files from the previous batch.
    // Files that already uploaded successfully are removed so a retry cannot
    // create duplicates.
    const next = current.filter(
      (item) => failedIds.has(item.id) || !batchIds.has(item.id)
    );

    current.forEach((item) => {
      if (!next.some((kept) => kept.id === item.id)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    commitFiles(next);
    clearDoneTimer();
    setProgress(null);
    setResult(null);
    void handleUpload(next);
  };

  const imageCount = selectedFiles.length;
  const finishedCount = progress ? progress.completedFiles + progress.failedFiles : 0;
  const allFinished = !!progress && finishedCount >= progress.totalFiles;
  const hasFailures = (progress?.failedFiles ?? 0) > 0;
  const cleanComplete = allFinished && !hasFailures;
  const interactionLocked = uploading || cleanComplete;
  const uploadingCount = progress?.files.filter((file) => file.status === "uploading").length ?? 0;
  const queuedCount = progress?.files.filter((file) => file.status === "queued").length ?? 0;

  const summaryTitle = !progress
    ? ""
    : cleanComplete
      ? "Upload complete"
      : hasFailures && allFinished
        ? "Upload finished with errors"
        : uploadingCount > 0
          ? `Uploading ${uploadingCount} ${uploadingCount === 1 ? "image" : "images"}…`
          : queuedCount > 0
            ? "Preparing upload…"
            : "Finishing upload…";

  const summaryTone = cleanComplete
    ? "text-green-600"
    : hasFailures && allFinished
      ? "text-red-600"
      : "text-foreground/80";

  const buttonLabel = uploading
    ? "Uploading..."
    : cleanComplete
      ? "Uploaded"
      : hasFailures && allFinished
        ? "Retry failed"
        : `Upload ${imageCount} image${imageCount === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Collection Uploads </CardTitle>
          <CardDescription>Upload new images to the collection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category selector */}
          <div className="max-w-xs">
            <Label htmlFor="collection-category" className="mb-1.5 block text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={(v: Category) => setCategory(v)}>
              <SelectTrigger id="collection-category" disabled={interactionLocked}>
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
            onClick={() => !interactionLocked && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !interactionLocked) inputRef.current?.click();
            }}
            role="button"
            tabIndex={interactionLocked ? -1 : 0}
            aria-disabled={interactionLocked}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
              interactionLocked
                ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                : dragOver
                  ? "cursor-pointer border-accent bg-accent/5"
                  : "cursor-pointer border-border hover:border-accent/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={interactionLocked}
              aria-label="Upload collection images"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground/80">Drop images here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, GIF, WebP &mdash; max 10MB each, up to 5 at once</p>
          </div>

          {/* Upload progress */}
          {progress && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <ProgressRing
                  percent={allFinished ? 100 : progress.percent}
                  complete={cleanComplete}
                  failed={hasFailures && allFinished}
                />
                <div className="min-w-0">
                  <span className={`block font-semibold ${summaryTone}`}>{summaryTitle}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {progress.completedFiles} of {progress.totalFiles} uploaded
                    {hasFailures && (
                      <span className="text-red-600">
                        , {progress.failedFiles} failed
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {hasFailures && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {progress.failedFiles} {progress.failedFiles === 1 ? "image" : "images"} failed
                  {allFinished ? ". Only the failed images will be retried." : " — the remaining uploads will continue."}
                </p>
              )}

              {cleanComplete && (
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  All uploads complete.
                </p>
              )}
            </div>
          )}

          {/* File previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {imageCount} image{imageCount === 1 ? "" : "s"} selected
                  <span className="ml-2 text-xs font-normal text-muted-foreground">up to {MAX_FILES}</span>
                </p>
                {!interactionLocked && (
                  <Button variant="ghost" size="sm" onClick={clearFiles}>
                    Remove all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {selectedFiles.map((item, index) => {
                  const fileProgress = progress?.files[index];
                  return (
                    <PreviewTile
                      key={item.id}
                      item={item}
                      index={index}
                      status={progress ? fileProgress?.status : undefined}
                      percent={fileProgress?.percent ?? 0}
                      locked={interactionLocked}
                      onRemove={removeFile}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={hasFailures && allFinished ? retryFailedUploads : () => handleUpload()}
              disabled={imageCount === 0 || interactionLocked}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cleanComplete ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {buttonLabel}
            </Button>
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
