import { Instagram, Mail, Phone } from "lucide-react";

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export const Footer = () => {
  return (
    <footer className="bg-black text-primary-foreground py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
              Sista Events And Rentals
            </h3>
            <p className="text-primary-foreground/80 text-sm">
              Creating unforgettable moments with a sizeable budget since 2018.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#featured" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  logistics
                </a>
              </li>
              <li>
                <a href="#about" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Bookings
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Furniture Rentals</li>
              <li>Tents & Canopies</li>
              <li>Decor & Accessories</li>
              <li> Backdrops</li>
              <li>Event Lighting</li>
              <li>Event Consultation</li>
             
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3 mb-4">
              <a
                href="https://instagram.com/sistaevents.rentals"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://tiktok.com/@sistaevents.rentals"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-colors group"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
             
            </div>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <a href="mailto:info@sistaevents.com" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@sistaevents.com</span>
              </a>
              <a href="tel:0555182969" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="w-4 h-4" />
                <span>(+233) 555182969</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Sista Events And Rentals. All rights reserved.</p>
          <p>powered by BX GAMING AND MORE </p>
        </div>
      </div>
    </footer>
  );
};
