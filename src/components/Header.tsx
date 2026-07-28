import { Button } from "@/components/ui/button";
import { Menu, X, Home } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { images } from "@/lib/imageImports";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="glass-nav-inner" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-3 min-w-0 group"
            onClick={() => handleNavigation("/")}
            aria-label="Go to homepage"
          >
            <img
              src={images.misc.sistalogo}
              className="logo-icon transition-transform duration-300 group-hover:scale-110"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />

            <div className="inline-flex items-center min-w-0 max-w-[calc(100vw-8rem)] sm:max-w-none">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-[#FFD700] to-accent to-primary bg-clip-text text-transparent truncate whitespace-nowrap drop-shadow-sm">
                SISTA EVENTS AND RENTALS
              </p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {location.pathname === "/" ? (
              <>
                <button
                  onClick={() => scrollToSection("services")}
                  className="glass-nav-link"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection("featured")}
                  className="glass-nav-link"
                >
                  Logistics
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="glass-nav-link"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="glass-nav-link"
                >
                  Testimonials
                </button>
                <Button variant="secondary" onClick={() => scrollToSection("contact")} className="glass-nav-cta ml-2 active:scale-95 transition-transform">
                  Bookings
                </Button>
              </>
            ) : (
              <button
                onClick={() => handleNavigation("/")}
                aria-label="Go to home"
                className="glass-nav-link"
              >
                <Home className="w-4 h-4 mr-1.5" />
                Home
              </button>
            )}
          </nav>

          {location.pathname === "/" ? (
            <button
              className="md:hidden glass-nav-link !px-2.5 !py-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              <div className="transition-transform duration-300 ease-in-out rotate-0 data-[open='true']:rotate-90" data-open={isMenuOpen}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </button>
          ) : (
            <button
              className="md:hidden glass-nav-link !px-2.5 !py-2"
              onClick={() => handleNavigation("/")}
              aria-label="Go to home"
            >
              <Home className="h-5 w-5" />
            </button>
          )}
        </div>

        {location.pathname === "/" && isMenuOpen && (
          <nav id="mobile-nav" className="md:hidden mobile-menu-enter glass-mobile-nav -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-5 pt-4 flex flex-col gap-1">
            <button
              onClick={() => scrollToSection("services")}
              className="mobile-menu-item text-left text-sm font-medium glass-nav-link-mobile"
              style={{ animationDelay: "50ms" }}
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("featured")}
              className="mobile-menu-item text-left text-sm font-medium glass-nav-link-mobile"
              style={{ animationDelay: "100ms" }}
            >
              Logistics
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="mobile-menu-item text-left text-sm font-medium glass-nav-link-mobile"
              style={{ animationDelay: "150ms" }}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="mobile-menu-item text-left text-sm font-medium glass-nav-link-mobile"
              style={{ animationDelay: "200ms" }}
            >
              Testimonials
            </button>
            <div className="mobile-menu-item mt-2 px-1" style={{ animationDelay: "250ms" }}>
              <Button
                variant="secondary"
                onClick={() => scrollToSection("contact")}
                className="w-full active:scale-[0.98] transition-transform"
              >
                Bookings
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
