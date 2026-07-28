import { Instagram, Mail, Phone, MapPin } from "lucide-react";

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
    <footer className="bg-black text-primary-foreground py-12 lg:py-16 relative">
      <div className="footer-gradient-border absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
              Sista Events And Rentals
            </h3>
            <p className="text-primary-foreground/80 text-sm">
              Creating unforgettable moments with a sizeable budget. <p> since 2018</p>            
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#services" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200" />
                  Services
                </a>
              </li>
              <li>
                <a href="#featured" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200" />
                  logistics
                </a>
              </li>
              <li>
                <a href="#about" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200" />
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-primary-foreground/80 hover:text-accent transition-colors duration-200 inline-flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200" />
                  Bookings
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Furniture Rentals
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Tents & Canopies
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Decor & Accessories
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Backdrops
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Event Lighting
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
                Event Consultation
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3 mb-5">
              <a
                href="https://instagram.com/sistaevents.rentals"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-all duration-200 group hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://tiktok.com/@sistaevents.rentals"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-primary-foreground/10 hover:bg-accent/20 flex items-center justify-center transition-all duration-200 group hover:scale-110"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
            <div className="space-y-2.5 text-sm text-primary-foreground/80">
              <a href="mailto:info@sistaevents.com" className="flex items-center gap-2 hover:text-accent transition-colors duration-200">
                <Mail className="w-4 h-4" />
                <span>info@sistaevents.com</span>
              </a>
              <a href="tel:0555182969" className="flex items-center gap-2 hover:text-accent transition-colors duration-200">
                <Phone className="w-4 h-4" />
                <span>(+233) 555182969</span>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sista+Events+and+Rentals+Kingstown"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-accent transition-colors duration-200"
              >
                <MapPin className="w-4 h-4" />
                <span>Amanfro-Kingstown,Kasoa</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Sista Events And Rentals. All rights reserved.</p>
          <p>
            Bxcoda - powered by <span className="text-sky-300 font-medium">BX GAMING AND MORE </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
