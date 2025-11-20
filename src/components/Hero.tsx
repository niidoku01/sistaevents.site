import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-event.jpg";

export const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
          Elevate Your Events with
          <span className="block bg-gradient-accent bg-clip-text text-transparent mt-2">
            Premium Rentals
          </span>
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Transform your special occasions with our curated collection of elegant furniture, decor, and event essentials
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button variant="hero" size="lg" onClick={scrollToContact}>
            Request a Quote
          </Button>
          <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
            View Our Collection
          </Button>
        </div>
      </div>
    </section>
  );
};
