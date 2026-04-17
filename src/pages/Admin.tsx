import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminNav from "./admin/AdminNav";
import Bookings from "./admin/Bookings";
import { ManageReviews } from "./admin/ManageReviews";
import ManageFeaturedAvailability from "./admin/ManageFeaturedAvailability";
import ManagePopupAds from "./admin/ManagePopupAds";
import Login from "./admin/Login";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/imageImports";

const Admin: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();
  const email = user?.email ?? "admin@gmail.com";
  const compactEmail = email.includes("@") ? email.split("@")[0] : email;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (!convexUrl) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Unavailable</h1>
          <p className="text-gray-600">
             configure convex and refresh
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={images.misc.sistalogo}
                alt="Sista Events logo"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-md object-contain"
                loading="eager"
                decoding="async"
              />
              <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">Admin</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="sm:hidden text-xs text-gray-600 truncate max-w-[84px]">{compactEmail}</span>
              <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[220px]">{email}</span>
              <Button variant="outline" className="h-8 sm:h-9 px-3" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <AdminNav />
        <div className="mt-6">
          <Routes>
            <Route path="bookings" element={<Bookings />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="featured" element={<ManageFeaturedAvailability />} />
            <Route path="popup-ads" element={<ManagePopupAds />} />
            <Route path="*" element={<Navigate to="bookings" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;
