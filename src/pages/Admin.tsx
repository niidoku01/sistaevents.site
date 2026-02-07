import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminNav from "./admin/AdminNav";
import Bookings from "./admin/Bookings";
import UploadCollection from "./admin/UploadCollection";
import ManageCollection from "./admin/ManageCollection";
import { ManageReviews } from "./admin/ManageReviews";
import Login from "./admin/Login";
import { Button } from "@/components/ui/button";

const Admin: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AdminNav />
        <div className="mt-6">
          <Routes>
            <Route path="bookings" element={<Bookings />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="upload" element={<UploadCollection />} />
            <Route path="manage" element={<ManageCollection />} />
            <Route path="*" element={<Navigate to="bookings" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;
