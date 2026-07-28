import React, { useRef, useEffect, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarClock, MessageSquareQuote, ListChecks,
  Megaphone, Upload, Images, LayoutGrid,
} from "lucide-react";

const navItems = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/featured", label: "Logistics", icon: ListChecks },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/manage", label: "Manage", icon: Images },
  { to: "/admin/popup-ads", label: "Ads", icon: Megaphone },
  { to: "/admin/planner", label: "Planner", icon: LayoutGrid },
];

function useActiveTabRect(containerRef: React.RefObject<HTMLDivElement | null>) {
  const location = useLocation();
  const [activeRect, setActiveRect] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const active = containerRef.current.querySelector("[aria-current]");
    if (active) {
      const cr = containerRef.current.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      setActiveRect({ left: ar.left - cr.left + containerRef.current.scrollLeft, width: ar.width });
    }
  }, [containerRef, location.pathname]);

  useEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return activeRect;
}

const AdminNav: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRect = useActiveTabRect(containerRef);

  return (
    <nav className="relative rounded-2xl border border-white/40 bg-white/50 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.04)] p-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-300/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-amber-400/8 rounded-full blur-2xl animate-pulse [animation-delay:1s]" />
      </div>

      <div
        ref={containerRef}
        className="relative flex sm:grid sm:grid-cols-7 gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-1 px-1 sm:mx-0 sm:px-0"
      >
        {activeRect && (
          <div
            className="absolute top-0 bottom-0 z-0 rounded-xl bg-gradient-to-br from-amber-400/12 via-amber-500/6 to-yellow-400/10 border border-amber-300/25 shadow-[0_0_16px_rgba(245,158,11,0.10)] transition-all duration-300 ease-out"
            style={{ left: activeRect.left, width: activeRect.width }}
          />
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `snap-start shrink-0 relative z-10 rounded-xl px-2 py-2 sm:px-3 sm:py-3.5 text-[11px] sm:text-[13px] font-semibold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-[68px] sm:min-w-0 group ${
                  isActive
                    ? "text-amber-600"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-200 ${
                    isActive
                      ? "text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.45)]"
                      : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
                  }`} />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-[10px] leading-tight">{item.label}</span>

                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] sm:hidden" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNav;
