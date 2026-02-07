const API_URL = "http://localhost:5000/api";

export const bookingAPI = {
  async submitBooking(bookingData: {
    name: string;
    email: string;
    phone: string;
    eventDate: string;
    message: string;
  }) {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) throw new Error("Failed to submit booking");
    return response.json();
  },

  async getAllBookings() {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) throw new Error("Failed to fetch bookings");
    return response.json();
  },

  async resendBooking(id: number | string) {
    const response = await fetch(`${API_URL}/bookings/${id}/resend`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to resend booking SMS");
    return response.json();
  },

  async deleteBooking(id: number | string) {
    const response = await fetch(`${API_URL}/bookings/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete booking");
    return response.json();
  },
};

export const collectionAPI = {
  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${API_URL}/uploads/collections`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload images");
    return response.json();
  },

  async getAllImages() {
    const response = await fetch(`${API_URL}/collections`);
    if (!response.ok) throw new Error("Failed to fetch collections");
    return response.json();
  },

  async deleteImage(filename: string) {
    const response = await fetch(`${API_URL}/collections/${filename}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete image");
    return response.json();
  },
};
