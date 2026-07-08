import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarClock, MessageSquareQuote, ListChecks, Megaphone, Upload, Images } from "lucide-react";

const navItems = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/featured", label: "logistics", icon: ListChecks },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/manage", label: "Manage", icon: Images },
  { to: "/admin/popup-ads", label: "Ads", icon: Megaphone },
];

const AdminNav: React.FC = () => {
  return (
    <nav className="rounded-xl border border-slate-200/60 bg-white shadow-sm p-1 backdrop-blur-sm">
      <div className="flex sm:grid sm:grid-cols-6 gap-1 sm:gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-1 px-1 sm:mx-0 sm:px-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `snap-start shrink-0 rounded-lg px-2 py-2 sm:px-3 sm:py-4 text-[11px] sm:text-sm font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-[68px] sm:min-w-0 ${
                  isActive
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md hover:shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`
              }
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden text-[10px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNav;
