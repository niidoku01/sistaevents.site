import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Elite Events
          </div>

          <nav className="hidden md:flex items-center gap-8">
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
              Gallery
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
              Get Quote
            </Button>
          </nav>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border flex flex-col gap-4">
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
              Gallery
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
            <Button variant="secondary" onClick={() => scrollToSection("contact")} className="w-full">
              Get Quote
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};
