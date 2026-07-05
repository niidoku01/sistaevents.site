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
  const response = await fetch(`${getNextApiBase()}/admin/convex-token`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to obtain admin token for Convex");
  const data = await response.json();
  _convexAdminSecret = data.token;
  return _convexAdminSecret;
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

async function uploadFileToConvex(file: File): Promise<UploadFileResult> {
  if (!convexClient) throw new Error("Convex client not available");
  const secret = await getConvexAdminSecret();
  const uploadUrl = await convexClient.mutation(api.collectionImages.generateUploadUrl, { secret });
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error("Upload to storage failed");
  const { storageId } = await response.json();
  const url = await convexClient.query(api.collectionImages.getStorageUrl, { storageId: storageId as Id<"_storage"> });
  return { storageId: storageId as Id<"_storage">, url, width: 0, height: 0 };
}

export const collectionAPI = {
  async uploadImages(files: File[], category: string = "weddings") {
    if (!convexClient) throw new Error("Convex client not available");
    const secret = await getConvexAdminSecret();
    const results: CollectionImageResult[] = [];
    for (const file of files) {
      const { storageId, url } = await uploadFileToConvex(file);
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
    }
    return { images: results };
  },

  async getAllImages() {
    if (!convexClient) return [];
    const images = await convexClient.query(api.collectionImages.listImages);
    return images;
  },

  async deleteImage(id: string) {
    if (!convexClient) throw new Error("Convex client not available");
    const secret = await getConvexAdminSecret();
    await convexClient.mutation(api.collectionImages.deleteImage, { id: id as Id<"collectionImages">, secret });
  },

  async updateImageCategory(id: string, category: string) {
    if (!convexClient) throw new Error("Convex client not available");
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


