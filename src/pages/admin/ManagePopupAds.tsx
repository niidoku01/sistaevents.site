import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type PopupAd = {
  _id: Id<"popupAds">;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  active: boolean;
};

const ManagePopupAds = () => {
  const { toast } = useToast();
  const ads = (useQuery(api.popupAds.listPopupAds) || []) as PopupAd[];
  const createPopupAd = useMutation(api.popupAds.createPopupAd);
  const setPopupAdActive = useMutation(api.popupAds.setPopupAdActive);
  const deletePopupAd = useMutation(api.popupAds.deletePopupAd);
  const [imageFileName, setImageFileName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
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

    if (!form.imageUrl.trim()) {
      toast({
        title: "Image required",
        description: "Please upload an ad image or provide an image URL before posting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const imageUrl = form.imageUrl.trim() || undefined;

      await createPopupAd({
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
      setImageFileName("");
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

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: result }));
      setImageFileName(file.name);
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Could not read the selected image.",
        variant: "destructive",
      });
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
                <p className="text-sm text-slate-700 mb-1">Image URL (required if no upload)</p>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-[11px] text-slate-500 mt-1">Use a hosted URL, or upload an image below.</p>
              </div>
              <div>
                <p className="text-sm text-slate-700 mb-1">Upload Ad Image (required if no URL)</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {imageFileName ? `Selected: ${imageFileName}` : "No file selected"}
                </p>
              </div>
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
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
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
