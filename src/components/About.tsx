import { CheckCircle2 } from "lucide-react";

const features = [
  "Premium quality inventory",
  "Professional delivery & setup",
  "Flexible rental periods",
  "Dedicated event coordinators",
  "Affordable pricing packages",
  "24/7 customer support",
];

export const About = () => {
  return (
    <section id="about" className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Why Choose Us ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              With over 5 years of experience, we've transformed countless events into memorable experiences. Our touch of excellence and attention to detail sets us apart in the event planning industry.
            </p>
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-elegant border-4 border-black/20">
              <img 
                src="/src/assets/sabout.jpeg" 
                alt="Event Setup" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                  WebkitFontSmoothing: "antialiased",
                  objectPosition: "center"
                }}
                loading="lazy"
              />
            </div>
            
            </div>
          </div>
        </div>
    </section>
  );
}
