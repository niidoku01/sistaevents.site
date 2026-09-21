import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { scrollToId } from "@/lib/scrollTo";
import { images } from "@/lib/imageImports";

const HomeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
    <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
  </svg>
);

const TestimonialIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

const CollectionIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const BookingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Zm9.586 4.594a.75.75 0 0 0-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.116-.062l3-3.75Z" clipRule="evenodd" />
  </svg>
);

const AboutIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
  </svg>
);

const LogisticsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
    <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
    <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
  </svg>
);

const ServicesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.09a49.488 49.488 0 0 0-6 0v-.09a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    <path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 0 1-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" />
  </svg>
);

const NavIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-white/75 border border-white/60 shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-accent backdrop-blur-md">
    {children}
  </span>
);

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCollectionPage = location.pathname === "/our-collection";
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      raf = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    if (!isHomePage) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    scrollToId(id);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className={`glass-nav fixed top-0 left-0 right-0 z-50 ${isScrolled ? "glass-nav-scrolled" : ""}`}>
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
              fetchpriority="high"
            />
            <div className="inline-flex items-center min-w-0 max-w-[calc(100vw-8rem)] sm:max-w-none">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-[#FFD700] to-accent to-primary bg-clip-text text-transparent truncate whitespace-nowrap drop-shadow-sm">
                SISTA EVENTS AND RENTALS
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {!isHomePage && (
              <button
                onClick={() => handleNavigation("/")}
                aria-label="Go to home"
                className="glass-nav-link"
              >
                <HomeIcon className="w-4 h-4 mr-1.5" />
                Home
              </button>
            )}
            {!isCollectionPage && (
              <>
                <button onClick={() => scrollToSection("services")} className="glass-nav-link">
                  Services
                </button>
                <button onClick={() => scrollToSection("featured")} className="glass-nav-link">
                  Logistics
                </button>
                <button onClick={() => scrollToSection("about")} className="glass-nav-link">
                  About
                </button>
                <button onClick={() => scrollToSection("testimonials")} className="glass-nav-link">
                  Testimonials
                </button>
                <Button variant="secondary" onClick={() => scrollToSection("contact")} className="glass-nav-cta ml-2 active:scale-95 transition-transform">
                  Booking
                </Button>
              </>
            )}
          </nav>

          {/* Mobile: Home icon on collection page, hamburger on others */}
          {isCollectionPage ? (
            <button
              className="md:hidden glass-nav-link !px-2.5 !py-2"
              onClick={() => handleNavigation("/")}
              aria-label="Back to home"
            >
              <HomeIcon className="h-5 w-5 text-accent" />
            </button>
          ) : (
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
          )}
        </div>
      </div>

      {/* Mobile glass sidebar drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <nav
            id="mobile-nav"
            className="md:hidden fixed inset-y-0 right-0 z-[61] w-[min(82vw,20rem)] overflow-y-auto rounded-l-3xl bg-gradient-to-b from-white/85 via-white/70 to-white/50 backdrop-blur-2xl backdrop-saturate-150 border-l border-white/60 shadow-[-12px_0_48px_rgba(0,0,0,0.16)] px-4 sm:px-5 pt-20 pb-8 flex flex-col gap-1.5 mobile-drawer-enter"
          >
            {/* Top accent glow */}
            <div className="pointer-events-none absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-accent/10 to-transparent" />
            <div className="pointer-events-none absolute top-24 left-0 w-44 h-44 bg-accent/10 rounded-full blur-3xl opacity-60" />
            {/* Close button inside drawer */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 border border-white/50 text-foreground shadow-md hover:bg-white/80 hover:rotate-90 hover:shadow-lg active:scale-90 transition-all duration-300"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Home - show on collection page only, or on non-home pages */}
            {(isCollectionPage || !isHomePage) && (
              <button
                onClick={() => handleNavigation("/")}
                className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                style={{ animationDelay: "0ms" }}
              >
                <NavIcon><HomeIcon className="w-4 h-4" /></NavIcon>
                Home
              </button>
            )}

            {/* Collection page: only show Home, skip the rest */}
            {!isCollectionPage && (
              <>
                {!isHomePage && (
                  <div className="h-px bg-black/5 mx-3 my-1" />
                )}
                <button
                  onClick={() => scrollToSection("services")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "50ms" }}
                >
                  <NavIcon><ServicesIcon className="w-4 h-4" /></NavIcon>
                  Services
                </button>
                <button
                  onClick={() => scrollToSection("featured")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "100ms" }}
                >
                  <NavIcon><LogisticsIcon className="w-4 h-4" /></NavIcon>
                  Logistics
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "150ms" }}
                >
                  <NavIcon><AboutIcon className="w-4 h-4" /></NavIcon>
                  About
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "200ms" }}
                >
                  <NavIcon><TestimonialIcon className="w-4 h-4" /></NavIcon>
                  Testimonials
                </button>
                <button
                  onClick={() => handleNavigation("/our-collection")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "250ms" }}
                >
                  <NavIcon><CollectionIcon className="w-4 h-4" /></NavIcon>
                  Collection
                </button>
                <button
                  onClick={() => handleNavigation("/bookings")}
                  className="mobile-menu-item flex items-center gap-3 text-left text-sm font-medium glass-nav-link-mobile"
                  style={{ animationDelay: "300ms" }}
                >
                  <NavIcon><BookingIcon className="w-4 h-4" /></NavIcon>
                  Booking
                </button>
              </>
            )}
          </nav>
        </>
      )}
    </header>
  );
};
