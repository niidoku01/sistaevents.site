import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const featuredItems = [
  {
    title: "Crystal Chandeliers",
    category: "Lighting",
    description: "Stunning centerpiece lighting",
    available: true,
  },
  {
    title: "Chiavari Chairs",
    category: "Seating",
    description: "Classic elegance for any event",
    available: true,
  },
  {
    title: "Farm Tables",
    category: "Tables",
    description: "Rustic charm meets modern style",
    available: true,
  },
  {
    title: "White Stretch Tents",
    category: "Tents",
    description: "Contemporary outdoor coverage",
    available: true,
  },
  {
    title: "Gold Flatware Sets",
    category: "Dinnerware",
    description: "Premium table settings",
    available: true,
  },
  {
    title: "Floral Centerpieces",
    category: "Decor",
    description: "Fresh and silk arrangements",
    available: true,
  },
];

export const Featured = () => {
  return (
    <section id="featured" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Featured Items
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Popular choices for creating memorable events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredItems.map((item, index) => (
            <Card
              key={index}
              className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border"
            >
              <div className="h-48 lg:h-64 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  {item.available && (
                    <span className="text-xs text-accent font-medium">Available</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
