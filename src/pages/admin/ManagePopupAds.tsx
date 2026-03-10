import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const RECOMMENDED_WIDTH = 1200;
const RECOMMENDED_HEIGHT = 600;

const ManagePopupAds = () => {
  const { toast } = useToast();
  const ads = useQuery(api.popupAds.listAds, {}) || [];
  const createAd = useMutation(api.popupAds.createAd);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const setActive = useMutation(api.popupAds.setActive);
  const deleteAd = useMutation(api.popupAds.deleteAd);

  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [selectedImageMeta, setSelectedImageMeta] = useState<{
    width: number;
    height: number;
    sizeLabel: string;
  } | null>(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
    active: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: "Missing details",
        description: "Title and message are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      let imageUrl = form.imageUrl.trim() || undefined;

      // If a local image is selected, upload it and use the returned URL.
      if (selectedImageFile) {
        const postUrl = await generateUploadUrl();
        const uploadResponse = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImageFile.type },
          body: selectedImageFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Could not upload popup image");
        }

        const { storageId } = await uploadResponse.json();
        const storageUrl = new URL(import.meta.env.VITE_CONVEX_URL as string);
        imageUrl = `${storageUrl.origin}/api/storage/${storageId}`;
      }

      await createAd({
        title: form.title.trim(),
        message: form.message.trim(),
        imageUrl,
        ctaText: form.ctaText.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
        active: form.active,
      });

      toast({
        title: "Popup ad created",
        description: form.active ? "This ad is now active on the homepage." : "Ad saved as inactive.",
      });

      setForm({
        title: "",
        message: "",
        imageUrl: "",
        ctaText: "",
        ctaUrl: "",
        active: true,
      });
      setSelectedImageFile(null);
      setSelectedImagePreview("");
    } catch {
      toast({
        title: "Create failed",
        description: "Could not create popup ad.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedImageFile(file);

    if (!file) {
      setSelectedImagePreview("");
      setSelectedImageMeta(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);

    const img = new Image();
    img.onload = () => {
      setSelectedImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeLabel: `${(file.size / 1024).toFixed(0)} KB`,
      });
    };
    img.src = previewUrl;
  };

  const handleToggle = async (id: any, active: boolean) => {
    try {
      await setActive({ id, active });
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

  const handleDelete = async (id: any) => {
    try {
      await deleteAd({ id });
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
      <Card>
        <CardHeader>
          <CardTitle>Create Ad</CardTitle>
          <CardDescription>popup announcements homepage display.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-700 mb-1">Title</p>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Special offer"
                />
              </div>
              <div>
                <p className="text-sm text-slate-700 mb-1">Image URL (optional)</p>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-[11px] text-slate-500 mt-1">upload a graphical content</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-700 mb-1">Upload graphic (optional)</p>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleImageFileChange}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recommended size: {RECOMMENDED_WIDTH} x {RECOMMENDED_HEIGHT}px (2:1), under 500KB.
              </p>
              {selectedImagePreview ? (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={selectedImagePreview}
                    alt="Popup preview"
                    className="h-16 w-16 rounded border object-cover"
                  />
                  <div className="text-xs text-slate-600">
                    <p>Selected image</p>
                    {selectedImageMeta ? (
                      <p>
                        {selectedImageMeta.width} x {selectedImageMeta.height}px • {selectedImageMeta.sizeLabel}
                      </p>
                    ) : (
                      <p>Loading dimensions...</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-sm text-slate-700 mb-1">Message</p>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder=" promotion or announcement info "
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-700 mb-1">CTA Text (optional)</p>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Book now"
                />
              </div>
              <div>
                <p className="text-sm text-slate-700 mb-1">CTA Link (optional)</p>
                <Input
                  value={form.ctaUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  placeholder="https://... or /#contact"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Set active immediately</p>
                <p className="text-xs text-slate-600">Only one popup ad can be active at a time.</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                aria-label="Set popup ad active"
              />
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-sm font-medium text-slate-900 mb-2">Sample Preview</p>
              <div className="max-w-sm rounded-md border bg-white overflow-hidden">
                {selectedImagePreview || form.imageUrl ? (
                  <img
                    src={selectedImagePreview || form.imageUrl}
                    alt="Ad sample"
                    className="w-full h-36 object-cover"
                  />
                ) : null}
                <div className="p-3">
                  <p className="text-base font-semibold text-slate-900">
                    {form.title.trim() || "Special Offer"}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">
                    {form.message.trim() || "Your ad message will appear here."}
                  </p>
                  {form.ctaText.trim() ? (
                    <div className="mt-2 inline-flex rounded bg-slate-900 px-3 py-1 text-xs text-white">
                      {form.ctaText}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Popup Ad"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Popup Ads</CardTitle>
          <CardDescription>Activate, deactivate, or delete ads.</CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <p className="text-sm text-slate-500">No popup ads yet.</p>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad._id} className="rounded-lg border p-4 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900 truncate">{ad.title}</p>
                        <Badge variant={ad.active ? "default" : "secondary"}>
                          {ad.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{ad.message}</p>
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.title} className="mt-2 h-12 w-12 rounded border object-cover" />
                      ) : null}
                      {ad.ctaText && (
                        <p className="text-xs text-slate-500 mt-1">CTA: {ad.ctaText}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleToggle(ad._id, !ad.active)}>
                        {ad.active ? "Deactivate" : "Set Active"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(ad._id)}>
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
