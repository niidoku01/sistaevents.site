import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim() || "";
let convexClient: ConvexHttpClient | null = null;
if (convexUrl) {
  try {
    convexClient = new ConvexHttpClient(convexUrl);
  } catch {
    console.warn("Failed to create ConvexHttpClient");
  }
}

const configuredApiUrls = (import.meta.env.VITE_API_URLS as string | undefined)
  ?.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const fallbackApiUrl = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000" : "");

const apiBases = (configuredApiUrls && configuredApiUrls.length > 0
  ? configuredApiUrls
  : fallbackApiUrl
    ? [fallbackApiUrl]
    : []
).map((url) => url.replace(/\/+$/, ""));

let apiRotationIndex = 0;
let _authToken: string | null = null;
let _convexAdminSecret: string | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
  _convexAdminSecret = null;
};

const getNextApiBase = () => {
  if (apiBases.length === 0) {
    throw new Error("Admin API is not configured — set VITE_API_URL to the deployed backend URL");
  }

  const next = apiBases[apiRotationIndex];
  apiRotationIndex = (apiRotationIndex + 1) % apiBases.length;
  return `${next}/api`;
};

const authHeaders = (): Record<string, string> => {
  if (_authToken) {
    return { Authorization: `Bearer ${_authToken}` };
  }
  return {};
};

export const getConvexAdminSecret = async (): Promise<string> => {
  if (_convexAdminSecret) return _convexAdminSecret;

  if (apiBases.length === 0) {
    throw new Error("Admin API is not configured — set VITE_API_URL to the deployed backend URL");
  }

  // Try every base so a single unreachable server can't break uploads.
  // Rotate the start position so repeated failures don't always hit the same host.
  const startIndex = apiRotationIndex % apiBases.length;
  const order = [...apiBases.slice(startIndex), ...apiBases.slice(0, startIndex)];
  let lastError: unknown = null;

  for (const base of order) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${base}/api/admin/convex-token`, {
        headers: authHeaders(),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`Convex admin token fetch failed (${response.status}):`, body);
        lastError = new Error(`Failed to obtain admin token for Convex (${response.status})`);
        continue;
      }
      const data = await response.json();
      _convexAdminSecret = data.token;
      apiRotationIndex = (apiRotationIndex + 1) % apiBases.length;
      return _convexAdminSecret;
    } catch (err) {
      lastError = err;
      console.error(`Convex admin token fetch failed for ${base}:`, err);
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof Error && lastError.message.startsWith("Failed to obtain admin token for Convex")) {
    throw lastError;
  }
  throw new Error(
    "Failed to obtain admin token — server unreachable. " +
      "Start the backend (`npm run dev` in /server) or set VITE_API_URL to the deployed backend URL."
  );
};

export const bookingAPI = {
  async submitBooking(bookingData: {
    name: string;
    email: string;
    phone: string;
    eventDate: string;
    message: string;
  }) {
    const response = await fetch(`${getNextApiBase()}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) throw new Error("Failed to submit booking");
    return response.json();
  },

  async getAllBookings() {
    const response = await fetch(`${getNextApiBase()}/bookings`, { headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch bookings");
    return response.json();
  },

  async resendBooking(id: number | string) {
    const response = await fetch(`${getNextApiBase()}/bookings/${id}/resend`, { method: "POST", headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to resend booking SMS");
    return response.json();
  },

  async deleteBooking(id: number | string) {
    const response = await fetch(`${getNextApiBase()}/bookings/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to delete booking");
    return response.json();
  },
};

type CollectionImageResult = {
  _id: string;
  storageId?: string | null;
  r2Key?: string | null;
  srcset?: string | null;
  originalName: string;
  size: number;
  contentType: string;
  category: string;
  uploadedAt: number;
  url: string | null;
  width?: number;
  height?: number;
  variants?: UploadVariant[];
};

type UploadVariant = {
  width: number;
  key: string;
  url: string;
};

type UploadFileResult = {
  r2Key: string;
  url: string | null;
  width: number;
  height: number;
  srcset?: string | null;
  variants?: UploadVariant[];
};

export type UploadFileStatus = "queued" | "uploading" | "done" | "failed";

export type UploadProgressState = {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  percent: number;
  currentFile: string | null;
  files: { name: string; status: UploadFileStatus }[];
};

const UPLOAD_CONCURRENCY = 8;

async function getCollectionUploadUrl(file: File, category: string): Promise<{ key: string; publicUrl: string }> {
  const response = await fetch(`${getNextApiBase()}/collections/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size, category }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const detail = typeof body === "object" && body !== null ? (body as { error?: unknown }) : null;
    const message = typeof detail?.error === "string" ? detail.error : `Failed to get upload URL (${response.status})`;
    throw new Error(message);
  }

  const data = body as { key?: unknown; publicUrl?: unknown };
  if (typeof data?.key !== "string" || typeof data?.publicUrl !== "string") {
    throw new Error("Upload URL response is malformed");
  }
  return { key: data.key, publicUrl: data.publicUrl };
}

function uploadBlobToServerWithProgress(
  key: string,
  file: File,
  onProgress: (transferred: number) => void
): Promise<{ variants?: UploadVariant[]; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${getNextApiBase()}/collections/upload-file?key=${encodeURIComponent(key)}`);
    const auth = authHeaders();
    if (auth.Authorization) xhr.setRequestHeader("Authorization", auth.Authorization);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let payload: { variants?: UploadVariant[]; width?: number; height?: number } = {};
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          /* empty body; variants optional */
        }
        resolve(payload);
      } else {
        let detail = "";
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error) detail = ` — ${parsed.error}`;
        } catch {
          /* not JSON; ignore */
        }
        const hint =
          detail ||
          (xhr.status === 403
            ? " — the R2 API token needs 'Object Read & Write' permission in Cloudflare"
            : "");
        reject(new Error(`Upload failed (${xhr.status} ${xhr.statusText})${hint}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });
}

async function uploadFileToR2(
  file: File,
  category: string,
  onProgress?: (transferred: number) => void
): Promise<UploadFileResult> {
  const { key, publicUrl } = await getCollectionUploadUrl(file, category);
  const payload = await uploadBlobToServerWithProgress(key, file, onProgress ?? (() => {}));
  const variants = payload.variants ?? [];
  let srcset: string | undefined;
  if (variants.length > 0) {
    srcset = variants.map((v) => `${v.url} ${v.width}w`).join(", ");
  }
  return {
    r2Key: key,
    url: publicUrl,
    width: payload.width ?? 0,
    height: payload.height ?? 0,
    srcset,
    variants,
  };
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      await worker(items[current], current);
    }
  });
  await Promise.all(runners);
}

const IMAGES_CACHE_TTL_MS = 5 * 60 * 1000;
let imagesCache: { data: CollectionImageResult[]; fetchedAt: number } | null = null;
let imagesInFlight: Promise<CollectionImageResult[]> | null = null;

export const collectionAPI = {
  async uploadImages(
    files: File[],
    category: string = "weddings",
    onProgress?: (state: UploadProgressState) => void
  ) {
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    const results: CollectionImageResult[] = [];
    const failures: { name: string; error: Error }[] = [];
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const statuses = new Map<string, UploadFileStatus>();
    files.forEach((f) => statuses.set(f.name, "queued"));

    let transferredBytes = 0;
    let completedFiles = 0;

    const notify = (currentFile: string | null) => {
      onProgress?.({
        totalFiles: files.length,
        completedFiles,
        failedFiles: failures.length,
        percent: totalBytes === 0 ? 100 : Math.min(100, Math.round((transferredBytes / totalBytes) * 100)),
        currentFile,
        files: files.map((f) => ({ name: f.name, status: statuses.get(f.name) ?? ("queued" as const) })),
      });
    };

    await runWithConcurrency(files, UPLOAD_CONCURRENCY, async (file) => {
      let contributed = 0;
      statuses.set(file.name, "uploading");
      try {
        const { r2Key, url, width, height, srcset } = await uploadFileToR2(file, category, (transferred) => {
          transferredBytes += transferred - contributed;
          contributed = transferred;
          notify(file.name);
        });
        const id = await convexClient.mutation(api.collectionImages.saveImage, {
          r2Key,
          url,
          srcset: srcset ?? undefined,
          width: width || undefined,
          height: height || undefined,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          category,
          secret,
        });
        imagesCache = null;
        results.push({
          _id: id,
          r2Key,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          category,
          uploadedAt: Date.now(),
          url: url ?? null,
          srcset: srcset ?? null,
          width: width || undefined,
          height: height || undefined,
        });
        transferredBytes += file.size - contributed;
        contributed = file.size;
        completedFiles += 1;
        statuses.set(file.name, "done");
        notify(null);
      } catch (err) {
        transferredBytes -= contributed;
        contributed = 0;
        statuses.set(file.name, "failed");
        const error = err instanceof Error ? err : new Error("Upload failed");
        console.error(`Collection upload failed for "${file.name}":`, error.message);
        failures.push({ name: file.name, error });
        notify(null);
      }
    });

    if (failures.length > 0) {
      const failedNames = failures.map((f) => f.name).slice(0, 5).join(", ");
      const firstError = failures[0]?.error?.message ?? "unknown error";
      throw new Error(
        `${failures.length} file(s) failed to upload (${failedNames}). ` +
          `${results.length} of ${files.length} uploaded successfully. ` +
          `First error: ${firstError}`
      );
    }

    return { images: results };
  },

  async getAllImages(options?: { refresh?: boolean }) {
    if (!convexClient) {
      console.error("getAllImages: Convex client not available — check VITE_CONVEX_URL");
      return [];
    }

    const now = Date.now();
    if (!options?.refresh && imagesCache && now - imagesCache.fetchedAt < IMAGES_CACHE_TTL_MS) {
      return imagesCache.data;
    }

    if (!imagesInFlight) {
      imagesInFlight = (async () => {
        try {
          const images = await convexClient.query(api.collectionImages.listImages);
          imagesCache = { data: images as CollectionImageResult[], fetchedAt: Date.now() };
          return images as CollectionImageResult[];
        } finally {
          imagesInFlight = null;
        }
      })();
    }
    return imagesInFlight;
  },

  async deleteImage(id: string) {
    // Remove the R2 object first (server-side) so the Convex row is only
    // removed once the file is actually gone. Convex storage blobs are left
    // untouched as a backup until the migration is verified.
    const images = await this.getAllImages();
    const img = images.find((row) => row._id === id);
    if (img?.r2Key) {
      const keysToDelete = [img.r2Key];
      if (img.variants && img.variants.length > 0) {
        keysToDelete.push(...img.variants.map((v) => v.key));
      }
      for (const r2Key of keysToDelete) {
        const response = await fetch(`${getNextApiBase()}/collections/r2/${encodeURIComponent(r2Key)}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!response.ok) {
          let message = `Failed to delete image from storage (${response.status})`;
          try {
            const body = await response.json();
            if (body && typeof body.error === "string") message = body.error;
          } catch {
            // keep the fallback message
          }
          throw new Error(message);
        }
      }
    }
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionImages.deleteImage, { id: id as Id<"collectionImages">, secret });
    imagesCache = null;
  },

  async updateImageCategory(id: string, category: string) {
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionImages.updateCategory, { id: id as Id<"collectionImages">, category, secret });
  },

  async getLayout(): Promise<Record<string, { orderedIds: string[]; hiddenIds: string[]; updatedAt: number }>> {
    if (!convexClient) return {};
    const layout = await convexClient.query(api.collectionLayout.getLayout);
    return (layout ?? {}) as Record<string, { orderedIds: string[]; hiddenIds: string[]; updatedAt: number }>;
  },

  async setLayout(category: string, orderedIds: string[], hiddenIds: string[]) {
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionLayout.setLayout, { category, orderedIds, hiddenIds, secret });
  },
};

export const popupAdAPI = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${getNextApiBase()}/uploads/popup-ads`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    let body: unknown;
    try {
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else {
        body = await response.text();
      }
    } catch (e) {
      body = undefined;
    }

    if (!response.ok) {
      const detail =
        typeof body === "object" && body !== null ? (body as { error?: unknown; message?: unknown }) : null;
      const fallback = `Upload failed: ${response.status} ${response.statusText}`;
      const detailMessage =
        typeof detail?.error === "string"
          ? detail.error
          : typeof detail?.message === "string"
            ? detail.message
            : fallback;
      const message = typeof body === "string" ? body : detailMessage;
      throw new Error(message);
    }

    return body;
  },
};


