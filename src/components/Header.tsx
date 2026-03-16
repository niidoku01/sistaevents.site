import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MdHome } from "react-icons/md";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { images } from "@/lib/imageImports";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCollectionPage = location.pathname === "/our-collection";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-1 md:gap-2 cursor-pointer" onClick={() => handleNavigation("/")}>
            <img 
              src={images.misc.sistalogo} 
              alt="Sista Events Logo" 
              className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 flex-shrink-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] hover:drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:scale-110 transition-all duration-300" 
              style={{ 
                imageRendering: "crisp-edges",
                filter: "contrast(1.0) saturate(1.9) brightness(1.1)",
                shapeRendering: "crispEdges",
                WebkitFontSmoothing: "antialiased",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)"
              }}
            />

            <div className="text-sm md:text-lg lg:text-xl font-bold bg-gradient-to-r from-[#FFD700] to-accent to-primary bg-clip-text text-transparent">
               SISTA EVENTS AND RENTALS
            </div>
          </div>


          <nav className="hidden md:flex items-center gap-8">
            {location.pathname === "/" ? (
              <>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection("featured")}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Testimonials
                </button>
                <Button variant="secondary" onClick={() => scrollToSection("contact")}>
                  Bookings
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation("/")}
                  aria-label="Go to home"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur hover:bg-white hover:text-amber-600 hover:shadow-md transition-all duration-200"
                >
                  <MdHome className="w-5 h-5 text-accent" />
                </button>
              
              </>
            )}
            
          </nav>

          {location.pathname === "/" ? (
            <button
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          ) : (
            <button
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur hover:bg-white hover:text-amber-600 hover:shadow-md transition-all duration-200"
              onClick={() => handleNavigation("/")}
              aria-label="Go to home"
            >
              <MdHome className="h-5 w-5 text-accent" />
            </button>
          )}
        </div>

        {location.pathname === "/" && isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border flex flex-col gap-4">
            {location.pathname === "/" ? (
              <>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-left text-foreground hover:text-accent transition-colors py-2"
                >
                  Services
                </button>
                <button
                  onClick={() => scrollToSection("featured")}
                  className="text-left text-foreground hover:text-accent transition-colors py-2"
                >
                  logistics
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-left text-foreground hover:text-accent transition-colors py-2"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-left text-foreground hover:text-accent transition-colors py-2"
                >
                  Testimonials
                </button>
                <Button
                  variant="secondary"
                  onClick={() => scrollToSection("contact")}
                  className="w-auto hover:bg-secondary active:bg-secondary/90"
                >
                  Bookings
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => handleNavigation("/")} className="w-full">
                  {isCollectionPage ? <MdHome className="w-5 h-5 text-accent" /> : "Home"}
                </Button>
                
              </>
            )}
            
          </nav>
        )}
      </div>
    </header>
  );
};
