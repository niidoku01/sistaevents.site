import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Basic",
    price: "From ₵1500",
    description: "Perfect for intimate gatherings and small events",
    features: [
      "Up to 50 guests",
      "Basic table & chair setup",
      "Canopy ",
      "Delivery & pickup",
      "Setup & takedown",
      "24-hour rental period"
    ],
    popular: false
  },
  {
    name: "Premium",
    price: "From ₵3500",
    description: "Our most popular choice for medium-sized events",
    features: [
      "Up to 100 guests",
      "Premium furniture selection",
      "Decorative accessories",
      "Canopies",
      "Centerpiece decor",
      "Backdrop setup",
      "Delivery, setup & takedown",
      "24-hour rental period",
      "Dedicated coordinator"
     
    ],
    popular: true
  },
  {
    name: "Luxury",
    price: "From ₵10000",
    description: "Complete event transformation for grand celebrations",
    features: [
      "Unlimited guests",
      "Full event design package",
      "Luxury furniture & decor",
      "Premium lighting",
      "Custom backdrops",
      "Tents & canopies",
      "Complete tableware",
      "Buffet & bar setup",
      "On-site event coordinator",
      "Delivery & setup",
      "full-day rental period"
    ],
    popular: false
  }
];

export const Packages = () => {
  const scrollToContactWithPackage = (packageName: string, packagePrice: string, features: string[]) => {
    // Create the pre-filled message
    const message = `I'm interested in the ${packageName} package (${packagePrice}).

Package includes:
${features.map(f => `• ${f}`).join('\n')}

Please provide me with a detailed quote and availability for my event.`;

    // Store in sessionStorage so Contact component can read it
    sessionStorage.setItem('selectedPackage', JSON.stringify({
      name: packageName,
      price: packagePrice,
      message: message
    }));

    // Scroll to contact section
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
    
    // Trigger a custom event to notify Contact component
    window.dispatchEvent(new CustomEvent('packageSelected'));
  };

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Event Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a package that fits your event size and budget. All packages are customizable!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {packages.map((pkg, index) => (
            <Card 
              key={index} 
              className={`relative ${
                pkg.popular 
                  ? "border-accent shadow-xl scale-105 z-10" 
                  : "border-border"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-accent mb-2">
                  {pkg.price}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pkg.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => scrollToContactWithPackage(pkg.name, pkg.price, pkg.features)}
                >
                  Get Quote
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Need a custom package? We'll create something perfect for your event.
          </p>
          <Button variant="link" onClick={() => scrollToContactWithPackage("Custom Package", "Contact for Pricing", ["Tailored to your specific needs", "Flexible options", "Professional consultation"])} className="text-accent">
            book here →
          </Button>
        </div>
      </div>
    </section>
  );
};
