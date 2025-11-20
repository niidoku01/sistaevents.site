import { CheckCircle2 } from "lucide-react";

const features = [
  "Premium quality inventory",
  "Professional delivery & setup",
  "Flexible rental periods",
  "Dedicated event coordinators",
  "Competitive pricing packages",
  "24/7 customer support",
];

export const About = () => {
  return (
    <section id="about" className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Why Choose Elite Events?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              With over a decade of experience, we've transformed countless events into unforgettable experiences. Our commitment to excellence and attention to detail sets us apart in the event rental industry.
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
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-accent/20 shadow-elegant" />
            <div className="absolute -bottom-6 -right-6 w-3/4 aspect-square rounded-2xl bg-gradient-to-br from-accent/20 to-primary shadow-elegant" />
          </div>
        </div>
      </div>
    </section>
  );
};
