import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UploadCollection: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<"weddings" | "funerals" | "corporate">("weddings");
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading"; message: string } | null>(null);
  
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const saveImage = useMutation(api.collections.saveImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    
    // Generate previews for all selected files
    const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
    setStatus(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setStatus({ type: "loading", message: `Uploading ${files.length} image(s)...` });
    
    try {
      let successCount = 0;
      
      // Upload each file
      for (const file of files) {
        // Step 1: Get a short-lived upload URL
        const postUrl = await generateUploadUrl();

        // Step 2: POST the file to the URL
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();

        // Step 3: Save the metadata to the database
        await saveImage({
          storageId,
          filename: `${Date.now()}-${file.name}`,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          category: category,
        });
        
        successCount++;
        setStatus({ type: "loading", message: `Uploading... (${successCount}/${files.length})` });
      }

      setStatus({ type: "success", message: `Successfully uploaded ${successCount} image(s)!` });
      setFiles([]);
      setPreviews([]);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload to Collection</CardTitle>
        <CardDescription>Add new images to your gallery collection</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category-select">Event Category</Label>
            <Select value={category} onValueChange={(value: "weddings" | "funerals" | "corporate") => setCategory(value)}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weddings">Weddings & Celebrations</SelectItem>
                <SelectItem value="funerals">Funerals</SelectItem>
                <SelectItem value="corporate">Corporate Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-upload">Select Images</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="max-w-md"
              />
            </div>
            {files.length > 0 && (
              <p className="text-sm text-gray-500">{files.length} file(s) selected</p>
            )}
          </div>

          {previews.length > 0 && (
            <div className="space-y-2">
              <Label>Previews</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previews.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 rounded-md shadow-sm object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={files.length === 0 || status?.type === "loading"} className="gap-2">
            <Upload className="w-4 h-4" />
            {status?.type === "loading" ? "Uploading..." : `Upload ${files.length > 0 ? files.length : ''} Image${files.length !== 1 ? 's' : ''}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadCollection;
