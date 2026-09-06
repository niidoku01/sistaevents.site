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

const fallbackApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:5000";

const apiBases = (configuredApiUrls && configuredApiUrls.length > 0 ? configuredApiUrls : [fallbackApiUrl]).map(
  (url) => url.replace(/\/+$/, "")
);

let apiRotationIndex = 0;
let _authToken: string | null = null;
let _convexAdminSecret: string | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
  _convexAdminSecret = null;
};

const getNextApiBase = () => {
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

const getConvexAdminSecret = async (): Promise<string> => {
  if (_convexAdminSecret) return _convexAdminSecret;

  try {
    const response = await fetch(`${getNextApiBase()}/admin/convex-token`, { headers: authHeaders() });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Convex admin token fetch failed (${response.status}):`, body);
      throw new Error(`Failed to obtain admin token for Convex (${response.status})`);
    }
    const data = await response.json();
    _convexAdminSecret = data.token;
    return _convexAdminSecret;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Failed to obtain")) throw err;
    throw new Error("Failed to obtain admin token — server unreachable");
  }
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
  storageId: string;
  originalName: string;
  size: number;
  contentType: string;
  category: string;
  uploadedAt: number;
  url: string | null;
  width?: number;
  height?: number;
};

type UploadFileResult = {
  storageId: Id<"_storage">;
  url: string | null;
  width: number;
  height: number;
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

const UPLOAD_CONCURRENCY = 4;

function uploadBlobToConvexWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (transferred: number) => void
): Promise<{ storageId: Id<"_storage"> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = xhr.response as { storageId?: unknown } | null;
        if (body && typeof body.storageId === "string") {
          resolve({ storageId: body.storageId as Id<"_storage"> });
        } else {
          reject(new Error("Upload to storage failed — no storage ID returned"));
        }
      } else {
        reject(new Error(`Upload to storage failed (${xhr.status} ${xhr.statusText})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload to storage failed — network error"));
    xhr.onabort = () => reject(new Error("Upload to storage aborted"));
    xhr.send(file);
  });
}

async function uploadFileToConvex(
  file: File,
  onProgress?: (transferred: number) => void
): Promise<UploadFileResult> {
  if (!convexClient) throw new Error("Convex client not available");
  const secret = await getConvexAdminSecret();
  const uploadUrl = await convexClient.mutation(api.collectionImages.generateUploadUrl, { secret });
  const { storageId } = await uploadBlobToConvexWithProgress(uploadUrl, file, onProgress ?? (() => {}));
  const url = await convexClient.query(api.collectionImages.getStorageUrl, { storageId });
  return { storageId, url, width: 0, height: 0 };
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
        const { storageId, url } = await uploadFileToConvex(file, (transferred) => {
          transferredBytes += transferred - contributed;
          contributed = transferred;
          notify(file.name);
        });
        const id = await convexClient.mutation(api.collectionImages.saveImage, {
          storageId,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          category,
          secret,
        });
        results.push({
          _id: id,
          storageId,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
          category,
          uploadedAt: Date.now(),
          url,
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
        failures.push({ name: file.name, error: err instanceof Error ? err : new Error("Upload failed") });
        notify(null);
      }
    });

    if (failures.length > 0) {
      const failedNames = failures.map((f) => f.name).slice(0, 5).join(", ");
      throw new Error(
        `${failures.length} file(s) failed to upload (${failedNames}). ` +
          `${results.length} of ${files.length} uploaded successfully.`
      );
    }

    return { images: results };
  },

  async getAllImages() {
    if (!convexClient) {
      console.error("getAllImages: Convex client not available — check VITE_CONVEX_URL");
      return [];
    }
    try {
      const images = await convexClient.query(api.collectionImages.listImages);
      return images;
    } catch (err) {
      console.error("getAllImages: Convex query failed:", err);
      throw err;
    }
  },

  async deleteImage(id: string) {
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionImages.deleteImage, { id: id as Id<"collectionImages">, secret });
  },

  async updateImageCategory(id: string, category: string) {
    if (!convexClient) throw new Error("Convex client not available — check VITE_CONVEX_URL");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionImages.updateCategory, { id: id as Id<"collectionImages">, category, secret });
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
      const message =
        typeof body === "string"
          ? body
          : body?.error || body?.message || `Upload failed: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return body;
  },
};


