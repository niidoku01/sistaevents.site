const configuredApiUrls = (import.meta.env.VITE_API_URLS as string | undefined)
  ?.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const fallbackApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:5000";

const apiBases = (configuredApiUrls && configuredApiUrls.length > 0 ? configuredApiUrls : [fallbackApiUrl]).map(
  (url) => url.replace(/\/+$/, "")
);

let apiRotationIndex = 0;

const getNextApiBase = () => {
  const next = apiBases[apiRotationIndex];
  apiRotationIndex = (apiRotationIndex + 1) % apiBases.length;
  return `${next}/api`;
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
    const response = await fetch(`${getNextApiBase()}/bookings`);
    if (!response.ok) throw new Error("Failed to fetch bookings");
    return response.json();
  },

  async resendBooking(id: number | string) {
    const response = await fetch(`${getNextApiBase()}/bookings/${id}/resend`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to resend booking SMS");
    return response.json();
  },

  async deleteBooking(id: number | string) {
    const response = await fetch(`${getNextApiBase()}/bookings/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete booking");
    return response.json();
  },
};

export const collectionAPI = {
  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${getNextApiBase()}/uploads/collections`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload images");
    return response.json();
  },

  async getAllImages() {
    const response = await fetch(`${getNextApiBase()}/collections`);
    if (!response.ok) throw new Error("Failed to fetch collections");
    return response.json();
  },

  async deleteImage(filename: string) {
    const response = await fetch(`${getNextApiBase()}/collections/${filename}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete image");
    return response.json();
  },
};
