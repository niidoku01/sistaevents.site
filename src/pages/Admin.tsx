import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminNav from "./admin/AdminNav";
import Login from "./admin/Login";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/imageImports";

const Bookings = lazy(() => import("./admin/Bookings"));
const ManageReviews = lazy(() => import("./admin/ManageReviews"));
const ManageFeaturedAvailability = lazy(() => import("./admin/ManageFeaturedAvailability"));
const ManagePopupAds = lazy(() => import("./admin/ManagePopupAds"));

const Admin: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const email = user?.email ?? "admin@gmail.com";
  const compactEmail = email.includes("@") ? email.split("@")[0] : email;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 p-6">
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/40 shadow-lg overflow-hidden">
          {/* Header (glass) */}
          <div className="sticky top-0 z-40 border-b border-white/30 bg-white/60 backdrop-blur-xl">
            <div className="px-4 py-2 sm:px-6 sm:py-3">
              <div className="flex justify-between items-center gap-2 sm:gap-4 flex-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-white/60 backdrop-blur-md border border-white/30 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src={images.misc.sistalogo}
                      alt="Sista Events logo"
                      className="h-10 w-10 object-contain"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-2xl font-bold text-slate-900 truncate whitespace-nowrap">ADMIN </h1>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold">
                      {compactEmail.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-600 truncate max-w-[200px] font-medium">{compactEmail}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <AdminNav />
            <div className="mt-8">
              <Suspense fallback={<div className="py-8 text-center text-slate-500">Loading...</div>}>
                <Routes>
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="reviews" element={<ManageReviews />} />
                  <Route path="featured" element={<ManageFeaturedAvailability />} />
                  <Route path="popup-ads" element={<ManagePopupAds />} />
                  <Route path="*" element={<Navigate to="bookings" replace />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
