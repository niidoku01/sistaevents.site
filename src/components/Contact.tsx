import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export const Contact = () => {
  const { toast } = useToast();
  const createBooking = useMutation(api.bookings.createBooking);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });

  // Pre-fill form from sessionStorage (for package quotes)
  useEffect(() => {
    const loadPackageData = () => {
      const data = sessionStorage.getItem('selectedPackage');
      if (data) {
        const pkg = JSON.parse(data);
        setFormData(prev => ({ ...prev, message: pkg.message }));
        sessionStorage.removeItem('selectedPackage');
      }
    };
    
    loadPackageData();
    window.addEventListener('packageSelected', loadPackageData);
    return () => window.removeEventListener('packageSelected', loadPackageData);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createBooking(formData);
      toast({
        title: "Booking Received!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        eventDate: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Bookings
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's discuss how we can make your event extraordinary
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardContent className="p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Your Name *
                      </label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Mr/Ms."
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address 
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="mail@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(0) 123456789"
                      />
                    </div>
                    <div>
                      <label htmlFor="eventDate" className="block text-sm font-medium text-foreground mb-2">
                        Event Date
                      </label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Tell us about your event 
                    </label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your event needs, logistics, guest count, venue, etc."
                      className="min-h-[150px]"
                    />
                  </div>

                  <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
                    <p className="text-muted-foreground">(+233) 555-182969</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                    <p className="text-muted-foreground">info@sistaevents.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                    <p className="text-muted-foreground">(+233) 279-689522</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Locate Us</h3>
                    <p className="text-muted-foreground">Kasoa - Accra <br /> Amanfro , kingstown</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
