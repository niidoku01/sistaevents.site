import { Armchair, Tent, Utensils, Lightbulb, MessageCircleMore, Flower2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Armchair,
    title: "Furniture Rentals",
    description: "Elegant chairs, tables, and lounge furniture for any occasion",
  },
  {
    icon: Tent,
    title: "Tents & Canopies",
    description: "Weather-proof solutions from intimate gatherings to grand celebrations",
  },
  {
    icon: Utensils,
    title: "Dinnerware & Linens",
    description: "Premium tableware, glassware, and luxury linens",
  },
  {
    icon: Lightbulb,
    title: "Lighting Solutions",
    description: "Create the perfect ambiance with our professional lighting",
  },
  {
    icon: Flower2,
    title: "Decor & Accessories",
    description: "Centerpieces, backdrops, and styling elements",
  },
  {
    icon: MessageCircleMore,
    title: "Event Consultation",
    description: "Expert guidance and planning assistance for your perfect event",
  },
];

export const Services = () => {
  return (
    <section id="services" className="section-mobile-padding bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-16" data-reveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Our Services
          </h2>
          <p className="hidden sm:block text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive event planning solutions tailored to your needs
          </p>
          <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto">
            Event services tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" data-reveal-stagger>
          {services.map((service, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border bg-card hover:shadow-[0_8px_40px_-12px_hsl(var(--accent)/0.2)] transition-all duration-500 hover:-translate-y-1 active:scale-[0.98]"
              data-reveal
              data-reveal-item
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-accent/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-4 sm:p-6 lg:p-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 sm:mb-5 group-hover:from-accent/30 group-hover:to-accent/10 group-hover:scale-110 transition-all duration-500">
                  <service.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
