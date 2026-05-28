import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarClock, MessageSquareQuote, ListChecks, Megaphone } from "lucide-react";

const navItems = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/featured", label: "logistics", icon: ListChecks },
  { to: "/admin/popup-ads", label: "Ads", icon: Megaphone },
];

const AdminNav: React.FC = () => {
  return (
    <nav className="rounded-xl border border-slate-200/60 bg-white shadow-sm p-1 backdrop-blur-sm">
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 ${
                  isActive
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md hover:shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`
              }
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNav;
