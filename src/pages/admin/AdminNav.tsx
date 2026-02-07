import React from "react";
import { NavLink } from "react-router-dom";

const AdminNav: React.FC = () => (
  <nav className="flex gap-1 border-b">
    <NavLink
      to="/admin/bookings"
      className={({ isActive }) =>
        `px-4 py-2 font-medium transition-colors ${
          isActive
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-900"
        }`
      }
    >
      Bookings
    </NavLink>
    <NavLink
      to="/admin/reviews"
      className={({ isActive }) =>
        `px-4 py-2 font-medium transition-colors ${
          isActive
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-900"
        }`
      }
    >
      Reviews
    </NavLink>
    <NavLink
      to="/admin/upload"
      className={({ isActive }) =>
        `px-4 py-2 font-medium transition-colors ${
          isActive
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-900"
        }`
      }
    >
      Upload Collection
    </NavLink>
    <NavLink
      to="/admin/manage"
      className={({ isActive }) =>
        `px-4 py-2 font-medium transition-colors ${
          isActive
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-900"
        }`
      }
    >
      Manage Collection
    </NavLink>
  </nav>
);

export default AdminNav;
