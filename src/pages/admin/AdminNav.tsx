import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarClock, MessageSquareQuote, Upload, Images, ListChecks, Megaphone } from "lucide-react";

const navItems = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/manage", label: "Manage", icon: Images },
  { to: "/admin/featured", label: "logistics", icon: ListChecks },
  { to: "/admin/popup-ads", label: "Ads", icon: Megaphone },
];

const AdminNav: React.FC = () => {
  return (
    <nav className="rounded-2xl border border-slate-200 bg-white shadow-sm p-2">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isActive
                    ? "bg-amber-400 text-slate-900 shadow"
                    : "text-slate-600 hover:text-gold-700 hover:bg-blue-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNav;
