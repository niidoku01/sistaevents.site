import { Armchair, Tent, Utensils, Lightbulb, Flower2, Music } from "lucide-react";
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
    icon: Music,
    title: "Audio & Entertainment",
    description: "Sound systems and entertainment equipment",
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Our Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive event rental solutions tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border"
            >
              <CardContent className="p-6 lg:p-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <service.icon className="w-6 h-6 lg:w-8 lg:h-8 text-accent" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">
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
