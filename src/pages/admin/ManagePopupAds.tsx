import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getConvexAdminSecret, popupAdAPI } from "@/lib/api";
import { useConvexAdminSecret } from "@/hooks/useConvexAdminSecret";
import { useMutation, useQuery } from "convex/react";
import { Check, ImagePlus, Megaphone, PartyPopper, Power, Trash2, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { celebrationTitle, isCelebrationAd } from "@/lib/popupAdCelebration";
// Image uploads are compressed in the browser, then stored in R2.

type PopupAd = {
  _id: Id<"popupAds">;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  celebratory?: boolean;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
  createdAt?: number;
  updatedAt?: number;
};

const EMPTY_FORM = {
  imageUrl: "",
  ctaText: "",
  ctaUrl: "",
  celebratory: false,
  active: false,
};

const MAX_IMAGE_BYTES = 450 * 1024;

const base64Bytes = (dataUrl: string) =>
  Math.ceil(((dataUrl.split(",")[1] || "").length * 3) / 4);

const dataUrlToFile = (dataUrl: string, fileName: string): File => {
  const [header, base64 = ""] = dataUrl.split(",");
  const mime = /^data:([^;]+)/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
};

const formatCreatedAt = (value?: number) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const describeCreateError = (err: unknown) => {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object"
        ? JSON.stringify(err)
        : String(err);

  if (/image url too long/i.test(raw)) {
    return "The Convex deployment still enforces the old 5,000-character image limit. Run `npx convex dev` (or `npx convex deploy`) to push the latest functions, then try again.";
  }
  if (/extra field.*celebratory|celebratory.*not in (the )?validator|unknown field.*celebratory|celebratory.*unknown/i.test(raw)) {
    return "The Convex deployment doesn't have the celebration flag yet. Run `npx convex dev` (or `npx convex deploy`) to push the latest schema.";
  }
  if (/extra field|argumentvalidationerror/i.test(raw)) {
    return "The Convex deployment is out of date. Run `npx convex dev` (or `npx convex deploy`) to push the latest schema, then try again.";
  }
  if (/server misconfiguration.*admin secret/i.test(raw)) {
    return "CONVEX_ADMIN_SECRET is not set on the Convex deployment. Add it in the Convex dashboard, then try again.";
  }
  if (/unauthorized|invalid admin secret/i.test(raw)) {
    return "The admin secret was rejected. Make sure CONVEX_ADMIN_SECRET matches on the server and on the Convex deployment.";
  }
  if (/failed to obtain admin token|server unreachable/i.test(raw)) {
    return "Could not reach the admin API to get the Convex admin token. Check that the backend is running and VITE_API_URL points to it.";
  }
  if (/r2.*not configured|r2_public_url/i.test(raw)) {
    return "Image storage is not configured on the server. Add the R2 environment variables, then try again.";
  }
  if (/failed to fetch|network ?error/i.test(raw)) {
    return "Network error while uploading the image. Check your connection and try again.";
  }
  if (/too large|1 ?mb|size limit/i.test(raw)) {
    return "The image is too large. Choose a smaller image and try again.";
  }

  const fallback = raw || "Could not create popup ad.";
  return fallback.length > 300 ? `${fallback.slice(0, 300)}...` : fallback;
};

const ManagePopupAds = () => {
  const { toast } = useToast();
  const { secret: adminSecret } = useConvexAdminSecret();
  const ads = (useQuery(api.popupAds.listPopupAds, adminSecret ? { secret: adminSecret } : "skip") || []) as PopupAd[];
  const createPopupAd = useMutation(api.popupAds.createPopupAd);
  const setPopupAdActive = useMutation(api.popupAds.setPopupAdActive);
  const deletePopupAd = useMutation(api.popupAds.deletePopupAd);
  const [imageFileName, setImageFileName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [celebrationPreview, setCelebrationPreview] = useState<{
    imageUrl: string;
    ctaText: string;
    active: boolean;
  } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!celebrationPreview) return;
    const timeout = window.setTimeout(() => setCelebrationPreview(null), 9000);
    return () => window.clearTimeout(timeout);
  }, [celebrationPreview]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFileName("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      toast({
        title: "Image required",
        description: "Upload an image to create the popup ad.",
        variant: "destructive",
      });
      return;
    }

    const imageBytes = base64Bytes(form.imageUrl);
    if (imageBytes > MAX_IMAGE_BYTES) {
      toast({
        title: "Image too large",
        description: `This image is ~${Math.round(imageBytes / 1024)}KB. Choose a smaller image and try again.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const secret = await getConvexAdminSecret();

      // Popup images live in R2; Convex only stores the short public URL.
      // This keeps the document small and avoids the legacy 5,000-character
      // imageUrl limit on older deployments. Fallback to local upload if R2
      // isn't configured in this environment.
      let imageUrl = form.imageUrl.trim();
      if (imageUrl.startsWith("data:")) {
        const imageFile = dataUrlToFile(imageUrl, `popup-${Date.now()}.jpg`);
        try {
          imageUrl = await popupAdAPI.uploadImageToR2(imageFile);
        } catch (r2Error) {
          console.warn("R2 popup upload failed, falling back to local upload:", r2Error);
          const result = await popupAdAPI.uploadImage(imageFile);
          const uploadedUrl =
            typeof result === "string"
              ? result
              : result && typeof result === "object"
                ? result.image?.url ?? result.url
                : null;
          if (!uploadedUrl) {
            throw r2Error;
          }
          imageUrl = uploadedUrl;
        }
      }

      const baseArgs = {
        title: "",
        message: "",
        imageUrl,
        ctaText: form.ctaText || undefined,
        ctaUrl: form.ctaUrl || undefined,
        active: form.active,
        secret,
      };

      const createdCelebratory = form.celebratory;
      try {
        await createPopupAd(createdCelebratory ? { ...baseArgs, celebratory: true } : baseArgs);
      } catch (error) {
        if (!createdCelebratory) throw error;
        // Older Convex deployments reject the `celebratory` argument, but they
        // still accept a plain title. Retry with the invisible marker so the
        // celebration ad can be saved (and go live) without a deployment.
        console.warn("Celebration flag rejected, saving with title marker:", error);
        await createPopupAd({ ...baseArgs, title: celebrationTitle() });
      }

      const createdActive = form.active;
      const createdCtaText = form.ctaText || "Book Now";

      toast({
        title: createdCelebratory ? "Celebration ad created" : "Popup ad created",
        description: createdCelebratory
          ? createdActive
            ? "It's live on the homepage with a confetti pop."
            : "Saved as inactive. Activate it to show the confetti popup."
          : createdActive
            ? "This ad is now active on the homepage."
            : "Ad saved as inactive.",
      });

      if (createdCelebratory) {
        setCelebrationPreview({
          imageUrl,
          ctaText: createdCtaText,
          active: createdActive,
        });
      }
      // If activating, clear local dismissal so the popup appears immediately
      if (createdActive) {
        try {
          localStorage.removeItem("homepagePopupDismissedAt");
        } catch {
          /* ignore */
        }
      }

      resetForm();
    } catch (err: unknown) {
      console.error("createPopupAd error:", err);
      toast({
        title: "Create failed",
        description: describeCreateError(err),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const compressImageToDataUrl = (file: File, maxBytes: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const maxWidth = 1600;
        const baseScale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        const drawAtScale = (scale: number) => {
          const width = Math.max(1, Math.round(img.width * baseScale * scale));
          const height = Math.max(1, Math.round(img.height * baseScale * scale));
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        };

        // Try progressively lower quality first, then shrink the canvas.
        let scale = 1;
        drawAtScale(scale);

        while (scale >= 0.2) {
          for (let quality = 0.82; quality >= 0.4; quality -= 0.08) {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            if (base64Bytes(dataUrl) <= maxBytes) {
              resolve(dataUrl);
              return;
            }
          }
          scale -= 0.1;
          if (scale >= 0.2) drawAtScale(scale);
        }

        reject(
          new Error(
            `Could not compress this image below ${Math.round(maxBytes / 1024)} KB. Please choose a smaller image.`
          )
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      img.src = objectUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImageToDataUrl(file, MAX_IMAGE_BYTES);
      const bytes = base64Bytes(compressed);

      setForm((prev) => ({ ...prev, imageUrl: compressed }));
      setImageFileName(file.name);
      toast({
        title: "Image ready",
        description: `Compressed to ~${Math.round(bytes / 1024)}KB and ready to save.`,
      });
    } catch (error) {
      console.error("Image compression error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not compress the selected image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleToggle = async (id: Id<"popupAds">, active: boolean) => {
    try {
      const secret = await getConvexAdminSecret();
      await setPopupAdActive({ id, active, secret });
      if (active) {
        try {
          localStorage.removeItem("homepagePopupDismissedAt");
        } catch {
          /* ignore */
        }
      }
      toast({
        title: "Updated",
        description: active ? "Ad is now active." : "Ad deactivated.",
      });
    } catch (error) {
      console.error("setPopupAdActive error:", error);
      toast({
        title: "Update failed",
        description: "Could not update ad status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: Id<"popupAds">) => {
    try {
      const secret = await getConvexAdminSecret();
      await deletePopupAd({ id, secret });
      toast({
        title: "Deleted",
        description: "Popup ad removed.",
      });
    } catch (error) {
      console.error("deletePopupAd error:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete popup ad.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Popup adverts</h2>
          <p className="max-w-xl text-sm text-slate-500">
            Create a promo popup for the homepage, preview it, and choose which ad goes live.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="w-fit rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600"
        >
          {ads.length} {ads.length === 1 ? "ad" : "ads"} saved
        </Badge>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Create Ad Card */}
        <Card className="border-slate-200/60 bg-white/60 shadow-xs backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 sm:text-xl">Create ad</CardTitle>
            <CardDescription>Upload an image and set up how the popup behaves.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="popup-ad-image" className="text-sm font-semibold text-slate-900">
                    Image
                  </label>
                  <span className="text-xs text-slate-500">Auto-compressed under 450 KB</span>
                </div>
                <label
                  htmlFor="popup-ad-image"
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isUploadingImage
                      ? "cursor-wait border-amber-300 bg-amber-50/50"
                      : "border-slate-200 bg-slate-50/60 hover:border-amber-300 hover:bg-amber-50/40"
                  }`}
                >
                  {isUploadingImage ? (
                    <span className="text-sm font-medium text-amber-700">Compressing image…</span>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 text-slate-400" />
                      <span className="max-w-full truncate text-sm font-medium text-slate-700">
                        {imageFileName || "Choose an image"}
                      </span>
                      <span className="text-xs text-slate-500">JPG, PNG or WebP</span>
                    </>
                  )}
                  <input
                    id="popup-ad-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="sr-only"
                  />
                </label>
                {imageFileName && !isUploadingImage && (
                  <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    {imageFileName} ready to save
                  </p>
                )}
              </div>

              {/* Ad style */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Ad style</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={!form.celebratory}
                    onClick={() => setForm((prev) => ({ ...prev, celebratory: false }))}
                    className={`flex h-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                      !form.celebratory
                        ? "border-slate-900 bg-slate-50 shadow-sm"
                        : "border-slate-200/60 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">Normal ad</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Standard popup, no effects</span>
                    </span>
                    {!form.celebratory && <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />}
                  </button>

                  <button
                    type="button"
                    aria-pressed={form.celebratory}
                    onClick={() => setForm((prev) => ({ ...prev, celebratory: true }))}
                    className={`flex h-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                      form.celebratory
                        ? "border-amber-400 bg-amber-50/70 shadow-sm"
                        : "border-slate-200/60 bg-white hover:border-amber-300"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <PartyPopper className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">Celebration ad</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Adds a confetti pop</span>
                    </span>
                    {form.celebratory && <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="popup-ad-cta-text" className="text-sm font-semibold text-slate-900">
                    Button text
                  </label>
                  <Input
                    id="popup-ad-cta-text"
                    value={form.ctaText}
                    onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Shop Now"
                    className="h-10 rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="popup-ad-cta-url" className="text-sm font-semibold text-slate-900">
                    Button link
                  </label>
                  <Input
                    id="popup-ad-cta-url"
                    value={form.ctaUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder="https://example.com/offer"
                    inputMode="url"
                    className="h-10 rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-linear-to-r from-amber-50/50 to-orange-50/50 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Activate immediately</p>
                  <p className="mt-0.5 text-xs text-slate-600">Only one ad can be live at a time.</p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                  aria-label="Set popup ad active"
                  className="shrink-0"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving || isUploadingImage}
                className="h-11 w-full rounded-lg bg-linear-to-r from-amber-400 to-amber-500 font-semibold text-white shadow-md transition-all duration-200 hover:from-amber-500 hover:to-amber-600 hover:shadow-lg disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : isUploadingImage
                    ? "Compressing image..."
                    : form.celebratory
                      ? "Save celebration ad"
                      : "Save popup ad"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card className="border-slate-200/60 bg-white/60 shadow-xs backdrop-blur-sm lg:sticky lg:top-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900">Live preview</CardTitle>
            <CardDescription>This is how the popup appears on the homepage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`overflow-hidden rounded-xl border bg-white shadow-xs ${
                form.celebratory ? "border-amber-300 ring-2 ring-amber-200/60" : "border-slate-200/60"
              }`}
            >
              <div className="relative aspect-[16/10] bg-slate-100">
                {form.imageUrl ? (
                  <>
                    <img
                      src={form.imageUrl}
                      alt="Ad preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      width={800}
                      height={500}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs font-medium">Image preview</span>
                  </div>
                )}
                {form.celebratory && (
                  <ConfettiBurst count={30} distance="380px" className="absolute inset-0 z-10" />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 bg-linear-to-br from-amber-50 to-white px-4 py-3">
                <span className="inline-flex min-w-0 items-center truncate rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                  {form.ctaText || "Book Now"}
                </span>
                <Badge
                  variant={form.active ? "default" : "secondary"}
                  className={
                    form.active
                      ? "shrink-0 border-green-200 bg-green-500/15 text-green-700"
                      : "shrink-0 bg-slate-200 text-slate-700"
                  }
                >
                  {form.active ? "Live" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Activating this ad switches off any other active ad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Ads */}
      <Card className="border-slate-200/60 bg-white/60 shadow-xs backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-900">Saved ads</CardTitle>
            <CardDescription>Activate or remove adverts.</CardDescription>
          </div>
          {ads.length > 0 && (
            <Badge variant="secondary" className="shrink-0 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
              {ads.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">No popup ads yet</p>
              <p className="mt-1 text-xs text-slate-400">Create your first ad above</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ads.map((ad) => {
                const celebratory = isCelebrationAd(ad);
                return (
                <li
                  key={ad._id}
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg border border-slate-200/60 object-cover shadow-xs"
                        loading="lazy"
                        decoding="async"
                        width={96}
                        height={64}
                      />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {celebratory ? "Celebration ad" : "Popup ad"}
                        </h3>
                        {celebratory && (
                          <Badge
                            variant="secondary"
                            className="gap-1 border-amber-200 bg-amber-100 text-amber-700"
                          >
                            <PartyPopper className="h-3 w-3" />
                            Celebration
                          </Badge>
                        )}
                        <Badge
                          variant={ad.active ? "default" : "secondary"}
                          className={
                            ad.active
                              ? "border-green-200 bg-green-500/15 text-green-700"
                              : "bg-slate-200 text-slate-700"
                          }
                        >
                          {ad.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {ad.ctaText && (
                        <p className="truncate text-xs text-slate-500">Button: {ad.ctaText}</p>
                      )}
                      {formatCreatedAt(ad.createdAt) && (
                        <p className="text-xs text-slate-400">Created {formatCreatedAt(ad.createdAt)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-stretch sm:flex-col sm:items-stretch">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(ad._id, !ad.active)}
                      className="flex-1 rounded-lg border-slate-200/60 font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-32 sm:flex-none"
                    >
                      <Power className="h-3.5 w-3.5" />
                      {ad.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(ad._id)}
                      className="flex-1 rounded-lg border-red-200/60 bg-red-500/10 font-medium text-red-700 transition-colors hover:bg-red-500/20 sm:w-32 sm:flex-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {celebrationPreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Celebration ad preview"
          onClick={() => setCelebrationPreview(null)}
        >
          <ConfettiBurst className="absolute inset-0" count={80} distance="110vh" />

          <div
            className="relative my-auto w-full max-w-[min(100vw-2rem,420px)] overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-2xl animate-bounce-in"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCelebrationPreview(null)}
              aria-label="Close celebration preview"
              className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/70 p-1.5 text-white transition-colors hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[16/10] bg-slate-100">
              <img
                src={celebrationPreview.imageUrl}
                alt="Celebration ad preview"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
                width={800}
                height={500}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
            </div>

            <div className="bg-linear-to-br from-amber-50 to-white px-5 py-4">
              <p className="text-lg font-bold text-slate-900">
                Your celebration ad is {celebrationPreview.active ? "live!" : "saved!"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {celebrationPreview.active
                  ? "Visitors will see this popup with a confetti burst."
                  : "Activate it from the list below to show it on the homepage."}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                  {celebrationPreview.ctaText}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCelebrationPreview(null)}
                  className="rounded-lg bg-amber-500 font-semibold text-white hover:bg-amber-600"
                >
                  Nice!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePopupAds;
