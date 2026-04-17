import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staticCollectionImagesByCategory } from "@/lib/staticCollections";

const UploadCollection: React.FC = () => {
  const totalImages =
    staticCollectionImagesByCategory.weddings.length +
    staticCollectionImagesByCategory.funerals.length +
    staticCollectionImagesByCategory.corporate.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Source (Static)</CardTitle>
        <CardDescription>
          Collection images are now code-based static assets to reduce image database usage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Collection uploads to Convex are disabled for this project mode.
            Add or remove images by updating <strong>src/lib/staticCollections.ts</strong> and <strong>src/lib/imageImports.ts</strong>.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Weddings</p>
              <Badge>{staticCollectionImagesByCategory.weddings.length} images</Badge>
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Funerals</p>
              <Badge>{staticCollectionImagesByCategory.funerals.length} images</Badge>
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Corporate</p>
              <Badge>{staticCollectionImagesByCategory.corporate.length} images</Badge>
            </div>
          </div>

          <p className="text-sm text-slate-600">Total static collection images: {totalImages}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadCollection;
