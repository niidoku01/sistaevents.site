import { CheckCircle2 } from "lucide-react";
import { images } from "@/lib/imageImports";

const features = [
  "Premium quality event logistics",
  "Professional delivery & setup",
  "Flexible rental periods",
  "Dedicated event coordinators",
  "Affordable pricing packages",
  "24/7 customer support",
];

export const About = () => {
  return (
    <section id="about" className="section-mobile-padding bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Why Choose Us ?
            </h2>
            <p className="hidden sm:block text-lg text-muted-foreground mb-8">
              With over 5 years of experience, we've transformed countless events into memorable experiences. Our touch of excellence and attention to detail sets us apart in the event planning industry.
            </p>
            <p className="sm:hidden text-sm text-muted-foreground mb-5">
              5+ years delivering memorable events with premium quality and reliable support.
            </p>
            <div className="grid gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/[0.04] transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:from-accent/30 group-hover:to-accent/10 transition-colors duration-300">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm sm:text-base text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 rounded-3xl blur-xl" />
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-elegant border border-border/50">
              <img 
                src={images.misc.sabout} 
                alt="Event Setup" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                style={{
                  objectPosition: "center"
                }}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                width={1200}
                height={1200}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
