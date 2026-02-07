import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/scover.jpeg";

export const Hero = () => {
  const navigate = useNavigate();

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const goToGallery = () => {
    navigate("/our-collection");
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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in">
           WE PLAN EVENTS  
          <br />
          <span className="text-xs md:text-base lg:text-lg bg-gradient-accent bg-clip-text text-transparent mt-4 block whitespace-nowrap overflow-x-auto mx-auto w-full text-center">
          • Weddings • Funerals • Parties • Graduation • Corporate Events  
          </span>
        </h1>
        <p className="text-sm md:text-base lg:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Turning moments into memories on a sizeable budget 
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button variant="hero" size="lg" onClick={scrollToContact}>
            Book Us Now
          </Button>
          <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={goToGallery}>
            View Our Collection
          </Button>
        </div>
      </div>
    </section>
  );
};
