import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminNav from "./admin/AdminNav";
import Login from "./admin/Login";
import NoIndexMeta from "./admin/NoIndexMeta";
import { images } from "@/lib/imageImports";
import { LogOut } from "lucide-react";

const Bookings = lazy(() => import("./admin/Bookings"));
const ManageReviews = lazy(() => import("./admin/ManageReviews"));
const ManageFeaturedAvailability = lazy(() => import("./admin/ManageFeaturedAvailability"));
const ManagePopupAds = lazy(() => import("./admin/ManagePopupAds"));
const UploadCollection = lazy(() => import("./admin/UploadCollection"));
const ManageCollection = lazy(() => import("./admin/ManageCollection"));
const EventPlanner = lazy(() => import("./admin/EventPlanner"));

const Admin: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const isPlannerRoute = location.pathname.includes("/planner");
  const email = user?.email ?? "admin@gmail.com";
  const compactEmail = email.includes("@") ? email.split("@")[0] : email;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-dvh sm:min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 p-2 sm:p-4 md:p-6 overflow-hidden">
      <NoIndexMeta />
      <div className="h-full sm:min-h-screen sm:flex sm:items-start sm:items-center sm:justify-center">
        <div className="h-full sm:h-auto w-full max-w-7xl rounded-2xl sm:rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col sm:min-h-0 sm:max-h-[95vh]">
          {/* Header (dynamic glass) */}
          <div className="flex-shrink-0 z-40 border-b border-white/30 bg-white/40 backdrop-blur-2xl">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex justify-between items-center gap-1 sm:gap-4 flex-nowrap">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <img
                    src={images.misc.sistalogo}
                    alt="Sista Events logo"
                    className="logo-icon"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                  />
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight truncate whitespace-nowrap">ADMIN</h1>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden sm:flex items-center gap-2.5 bg-white/50 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/60 shadow-sm">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-amber-500/20">
                      {compactEmail.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-600 truncate max-w-[140px] font-medium">{compactEmail}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-500 hover:text-red-500 hover:bg-red-50/80 hover:border-red-200/60 text-xs font-medium transition-all duration-200 shadow-sm active:scale-95"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 px-3 pt-3 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
              <AdminNav />
            </div>
            <div className={`flex-1 min-h-0 p-3 sm:p-6 md:p-8 pt-0 sm:pt-0 md:pt-0 ${isPlannerRoute ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}>
              <Suspense fallback={<div className="py-8 text-center text-slate-500">Loading...</div>}>
                <Routes>
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="reviews" element={<ManageReviews />} />
                  <Route path="featured" element={<ManageFeaturedAvailability />} />
                  <Route path="upload" element={<UploadCollection />} />
                  <Route path="manage" element={<ManageCollection />} />
                  <Route path="popup-ads" element={<ManagePopupAds />} />
                  <Route path="planner" element={<EventPlanner />} />
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
