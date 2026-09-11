import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import termsCertified from "@/assets/terms-certified.svg";

const packages = [
  {
    name: "Basic",
    price: "From ₵1,500",
    description: "Perfect for intimate gatherings and small events",
    features: [
      "Up to 50 guests",
      "Basic table & chair setup",
      "Canopy ",
      "Delivery & pickup",
      "Setup & takedown",
      "24-hour rental period"
    ],
    popular: false,
    terms: [
     "Free delivery applies only within Kasoa. Locations outside Kasoa incur additional transportation charges.",
     "Clients may provide their own truck. If we handle pickup or takedown, transportation cost will be confirmed with our driver and added to the invoice.",
     "Package prices cover only the services specification listed in this package. Extra items and special requests incur additional charges.",
     "Additional manpower ouside our setup and take downs  may incur extra charges.",
    "Modifications to the package, quantities, venue, date, or delivery arrangements after confirmation may incur additional charges and are subject to availability and confirmation.",
    "Special venue restrictions , limitations, or other requirements may require package adjustments and additional fees.",
    "Additional charges apply where setup, event services, collection, or dismantling exceeds the agreed time.",
    
    ]
  },
  {
    name: "Premium",
    price: "From ₵4,000",
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
    popular: true,
    terms: [
      "logistics delivery is free only in areas around Kasoa or 2km radius, outside these areas will attract extra transportation fees.",
      "Clients may provide their own truck. If we handle pickup or takedown, transportation cost will be confirmed with our driver and added to the invoice.",
      "Package prices cover only the services specification listed in this package. Extra items and special requests incur additional charges.",
      "Additional manpower ouside our setup and take downs  may incur extra charges.",
      "Modifications to the package, quantities, venue, date, or delivery arrangements after confirmation may incur additional charges and are subject to availability and confirmation.",
      "Special venue restrictions , limitations, or other requirements may require package adjustments and additional fees.",
      "A security deposit is required to secure your booking .",
      "Additional charges apply where setup, event services, collection, or dismantling exceeds the agreed time.",
    ]
  },
  {
    name: "Luxury",
    price: "From ₵10,000",
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
    popular: false,
    terms: [
      "Logistics delivery is included only in areas around Kasoa or 2km radius.",
      "Outside these areas will attract extra transportation fees.",
      "A security 50% deposit is required to secure your booking.",
      "Cancellation must be made at least 30days before the event date.",
      "The client is responsible for providing suitable accommodation  and treats for on-site coordinators where the event requires them to remain on-site beyond reasonable working hours ..",
      
    ]
  }
];

export const Packages = () => {
  const [activeTermsPackage, setActiveTermsPackage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState<Record<string, boolean>>({});

  const toggleAccepted = (packageName: string) => {
    setAcceptedTerms((prev) => ({ ...prev, [packageName]: !prev[packageName] }));
  };

  const scrollToContact = () => {
    sessionStorage.removeItem('selectedPackage');
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContactWithPackage = (packageName: string) => {
    const pkg = packages.find((p) => p.name === packageName);
    const payload = pkg
      ? JSON.stringify({
          name: pkg.name,
          price: pkg.price,
          description: pkg.description,
          features: pkg.features,
        })
      : packageName;
    sessionStorage.setItem("selectedPackage", payload);
    window.dispatchEvent(new CustomEvent("packageSelected"));
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "auto", block: "start" });
    setTimeout(() => {
      document.getElementById("name")?.focus();
    }, 100);
  };

  const openTerms = (packageName: string) => setActiveTermsPackage(packageName);
  const closeTerms = () => setActiveTermsPackage(null);

  const activePackage = packages.find((p) => p.name === activeTermsPackage);

  useEffect(() => {
    if (!activePackage) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTerms();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [activePackage]);

  return (
    <section className="section-mobile-padding bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-16" data-reveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Event Packages
          </h2>
          <p className="hidden sm:block text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a package that fits your event size and budget. All packages are customizable!
          </p>
          <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto">
            Flexible packages for every event and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto" data-reveal-stagger>
          {packages.map((pkg, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden flex flex-col h-full ${
                pkg.popular 
                  ? "border-accent shadow-[0_8px_40px_-12px_hsl(var(--accent)/0.25)] md:scale-100 z-10" 
                  : "border-border hover:shadow-lg"
              } transition-shadow duration-300`}
              data-reveal
              data-reveal-item
            >
              {pkg.popular && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] via-transparent to-accent/[0.06] pointer-events-none" />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center bg-gradient-to-r from-accent to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg shadow-accent/30">
                      Most Popular
                    </span>
                  </div>
                </>
              )}
              
              <CardHeader className={`text-center pb-4 sm:pb-6 ${pkg.popular ? "pt-12 sm:pt-14" : "pt-6 sm:pt-8"}`}>
                <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-accent mb-2">
                  {pkg.price}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                  {pkg.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6 flex-grow flex flex-col">
                <ul className="space-y-2.5 sm:space-y-3 flex-grow">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-accent" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

<div className="space-y-3">
                  {pkg.terms && (
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground leading-snug select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(acceptedTerms[pkg.name])}
                        onChange={() => toggleAccepted(pkg.name)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent cursor-pointer"
                        aria-label={`I agree to the terms and conditions for the ${pkg.name} package`}
                      />
                      <span className="text-xs leading-relaxed">
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={() => openTerms(pkg.name)}
                          className="relative z-10 inline-flex items-center gap-1 text-accent underline underline-offset-4 decoration-accent/50 hover:decoration-accent transition-colors cursor-pointer align-baseline bg-transparent border-0 p-0"
                          aria-label={`View terms and conditions for the ${pkg.name} package`}
                        >
                          <img
                            src={termsCertified}
                            alt=""
                            aria-hidden="true"
                            className="w-3.5 h-3.5 flex-shrink-0"
                          />
                          Terms &amp; Conditions
                        </button>
                      </span>
                    </div>
                  )}

                  {!acceptedTerms[pkg.name] && (
                    <p className="text-[11px] text-muted-foreground/80 text-center" role="note">
                      Please accept the terms &amp; conditions to get a quote.
                    </p>
                  )}
                </div>

                <Button
                  className="w-full active:scale-[0.98] transition-transform" 
                  variant={pkg.popular ? "default" : "outline"}
                  disabled={!acceptedTerms[pkg.name]}
                  aria-disabled={!acceptedTerms[pkg.name]}
                  onClick={() => scrollToContactWithPackage(pkg.name)}
                >
                  Get Quote
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="hidden sm:block text-muted-foreground mb-4">
            Need a custom package? We'll create something perfect for your event.
          </p>
          <Button variant="link" onClick={scrollToContact} className="text-accent hover:text-accent/80 active:text-accent transition-colors">
            Request a custom package quote
          </Button>
        </div>
      </div>

      {activePackage?.terms &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{
              minHeight: "100dvh",
              padding: "max(1rem, env(safe-area-inset-top, 1rem)) max(1rem, env(safe-area-inset-right, 1rem)) max(1rem, env(safe-area-inset-bottom, 1rem)) max(1rem, env(safe-area-inset-left, 1rem))",
            }}
            onClick={closeTerms}
            role="dialog"
            aria-modal="true"
            aria-label={`${activePackage.name} package terms and conditions`}
          >
            <div
              className="relative w-full max-w-md overflow-y-auto rounded-2xl border border-white/50 glass-popup text-foreground p-4 sm:p-6 md:p-8 animate-in zoom-in-95"
              style={{ maxHeight: "85dvh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeTerms}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close terms and conditions"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-accent/10 mb-2">
                  <img
                    src={termsCertified}
                    alt=""
                    aria-hidden="true"
                    className="w-7 h-7"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {activePackage.name} Package
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Terms &amp; Conditions</p>
              </div>

              <ul className="space-y-3">
                {activePackage.terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                      <Check className="w-2.5 h-2.5 text-accent" strokeWidth={3} />
                    </span>
                    <span className="text-xs sm:text-sm text-foreground leading-relaxed">{term}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-3 border-t border-border/60 text-center">
                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  Contact us for assistance based on your preferences.
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full mt-4 h-11 active:scale-[0.98] transition-transform"
                onClick={closeTerms}
              >
                Got it
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};
