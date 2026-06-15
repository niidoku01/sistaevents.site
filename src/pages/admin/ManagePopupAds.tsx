import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
// Image uploads will be stored in Convex as data URLs.

type PopupAd = {
  _id: Id<"popupAds">;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  active: boolean;
  startsAt?: number;
  endsAt?: number;
};

const ManagePopupAds = () => {
  const { toast } = useToast();
  const ads = (useQuery(api.popupAds.listPopupAds) || []) as PopupAd[];
  const createPopupAd = useMutation(api.popupAds.createPopupAd);
  const setPopupAdActive = useMutation(api.popupAds.setPopupAdActive);
  const deletePopupAd = useMutation(api.popupAds.deletePopupAd);
  const [imageFileName, setImageFileName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
    active: false,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      toast({
        title: "Image required",
        description: "Upload an image or paste an image URL.",
        variant: "destructive",
      });
      return;
    }

    // If image is a data URL, ensure it's not too large for Convex storage.
    if (form.imageUrl.startsWith("data:")) {
      const parts = form.imageUrl.split(",");
      const base64 = parts[1] || "";
      const bytes = Math.ceil((base64.length * 3) / 4);
      const MAX_BYTES = 200 * 1024; // 200KB
      if (bytes > MAX_BYTES) {
        toast({
          title: "Image too large",
          description: `Image is ~${Math.round(bytes / 1024)}KB. Please resize/compress under ${Math.round(
            MAX_BYTES / 1024
          )}KB before uploading.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      const imageUrl = form.imageUrl.trim() || undefined;

      await createPopupAd({
        title: "",
        message: "",
        imageUrl,
        ctaText: form.ctaText || undefined,
        ctaUrl: form.ctaUrl || undefined,
        active: form.active,
      });

      toast({
        title: "Popup ad created",
        description: form.active ? "This ad is now active on the homepage." : "Ad saved as inactive.",
      });

      setForm({
        imageUrl: "",
        ctaText: "",
        ctaUrl: "",
        active: true,
      });
      setImageFileName("");
    } catch (err) {
      console.error("createPopupAd error:", err);
      const raw = (err as any)?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
      const description = raw && raw.length > 300 ? raw.slice(0, 300) + "..." : raw || "Could not create popup ad.";
      toast({
        title: "Create failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) {
        setForm((prev) => ({ ...prev, imageUrl: result }));
        setImageFileName(file.name);
        toast({ title: "Image ready", description: "Image converted and will be saved to Convex." });
      } else {
        toast({ title: "Upload failed", description: "Could not read the selected image.", variant: "destructive" });
      }
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      toast({ title: "Upload failed", description: "Could not read the selected image.", variant: "destructive" });
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };


  const handleToggle = async (id: Id<"popupAds">, active: boolean) => {
    try {
      await setPopupAdActive({ id, active });
      toast({
        title: "Updated",
        description: active ? "Ad is now active." : "Ad deactivated.",
      });
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update ad status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: Id<"popupAds">) => {
    try {
      await deletePopupAd({ id });
      toast({
        title: "Deleted",
        description: "Popup ad removed.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete popup ad.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Ad Card */}
      <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Create Ad</CardTitle>
            <CardDescription className="text-sm">Popup advertisement for homepage</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Image URL</label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
                />
                <p className="text-xs text-slate-500">Paste a hosted image URL or upload below</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Upload Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  {isUploadingImage
                    ? "Converting image..."
                    : imageFileName
                      ? `✓ ${imageFileName}`
                      : "Max 200KB (auto-compressed)"}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Button Text</label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Shop Now"
                  className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Button Link (URL)</label>
                <Input
                  value={form.ctaUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  placeholder="https://example.com/offer"
                  className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="rounded-lg border border-slate-200/60 bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Activate Immediately</p>
                <p className="text-xs text-slate-600 mt-0.5">Only one ad can be active at a time</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                aria-label="Set popup ad active"
                className="ml-4"
              />
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Preview</p>
              <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm max-w-sm mx-auto">
                {form.imageUrl && (
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <img
                      src={form.imageUrl}
                      alt="Ad preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      width={800}
                      height={500}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  </div>
                )}
                <div className="bg-gradient-to-br from-amber-50 to-white px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    {form.ctaText || "Book Now"}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2.5 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isSaving ? "Saving..." : "Save Popup Ad"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Ads */}
      <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">Active Ads</CardTitle>
            <CardDescription>Manage and control your popup ads</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500 font-medium">No popup ads yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first ad above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad._id} className="rounded-lg border border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50 p-4 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-slate-900">Popup Ad</h3>
                        <Badge 
                          variant={ad.active ? "default" : "secondary"}
                          className={ad.active ? "bg-green-500/20 text-green-700 border-green-200" : "bg-slate-200 text-slate-700"}
                        >
                          {ad.active ? "● Active" : "○ Inactive"}
                        </Badge>
                      </div>
                      {ad.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={ad.imageUrl} 
                            alt="Popup ad preview" 
                            className="h-24 w-32 rounded-md border border-slate-200/60 object-cover shadow-sm" 
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            width={128}
                            height={96}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleToggle(ad._id, !ad.active)}
                        className="rounded-lg border-slate-200/60 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                      >
                        {ad.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(ad._id)}
                        className="rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-200/60 font-medium transition-colors"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagePopupAds;
