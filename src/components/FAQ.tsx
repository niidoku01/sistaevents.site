import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

// Custom ChatBot AI icon component
const ChatBotIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.95 21.63 10.97 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.36-3.88-.99l-.28-.15-2.89.45.45-2.89-.15-.28C4.36 14.73 4 13.41 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm3.5-9c-.83 0-1.5-.67-1.5-1.5S14.67 8 15.5 8 17 8.67 17 9.5 16.33 11 15.5 11zm-7 0c-.83 0-1.5-.67-1.5-1.5S6.67 8 7.5 8 9 8.67 9 9.5 8.33 11 7.5 11z"/>
  </svg>
);

const faqs = [
  {
    question: "How far in advance should I book your services?",
    answer: "We recommend booking at least 2-3 months in advance for optimal availability, especially for weddings and large events. However, we can accommodate last-minute bookings based on our current schedule."
  },
  {
    question: "Do you provide setup and takedown services?",
    answer: "Yes! Our professional team handles complete setup before your event and takedown afterward. This is included in our rental packages, ensuring you can focus on enjoying your special day."
  },
  {
    question: "What is your cancellation policy?",
    answer: "Cancellations made 30+ days before the event receive a full refund minus a small processing fee. Cancellations 15-30 days prior receive 50% refund. Within 15 days, deposits are non-refundable. We understand emergencies happen and work with clients case-by-case."
  },
  {
    question: "Can I see the items in person before booking?",
    answer: "Absolutely! We welcome you to visit our showroom to see our inventory firsthand. Please contact us to schedule an appointment so we can ensure someone is available to assist you."
  },
  {
    question: "Do you offer package deals?",
    answer: "Yes, we offer customized package deals that can save you money. Packages typically include chairs, tables, linens, and decor items. Contact us with your event details for a personalized quote."
  },
  {
    question: "What areas do you service?",
    answer: "We primarily service Kasoa and surrounding areas within a 50-mile radius. For events outside this area, additional delivery fees may apply. Contact us to confirm if we service your location."
  },
  {
    question: "What happens if an item is damaged during my event?",
    answer: "Normal wear and tear is expected and covered. However, significant damage or loss may result in a damage fee. We provide a detailed inspection checklist at pickup to document the condition of all items."
  },
  {
    question: "Do you require a deposit?",
    answer: "Yes, we require a 50% deposit to secure your booking. The remaining balance is due 7 days before your event date. We accept all major bank and mobile transfers, and cash payments."
  },
  {
    question: "Can I make changes to my order after booking?",
    answer: "Yes, you can modify your order up to 14 days before the event, subject to availability. Changes made within 14 days may incur additional fees. We're flexible and will do our best to accommodate your needs."
  },
  {
    question: "Do you provide staff for events?",
    answer: "While we provide delivery, setup, and takedown, we can recommend professional event staff and coordinators from our trusted partner network if you need additional support during your event."
  }
];

export const FAQ = () => {
  return (
    <section className="section-mobile-padding bg-muted/30">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-16" data-reveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="hidden sm:block text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers! Find quick answers to common questions about our services.
          </p>
          <p className="sm:hidden text-sm text-muted-foreground max-w-2xl mx-auto">
            Quick answers to common questions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4" data-reveal-stagger>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border/60 rounded-xl px-4 sm:px-6 hover:border-accent/30 transition-colors duration-200"
                data-reveal
                data-reveal-item
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 sm:py-5 active:scale-[0.99] transition-transform">
                  <span className="font-semibold text-sm sm:text-base text-foreground pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground pt-1 pb-4 sm:pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <a
              href="https://wa.me/233279689522?text=Hi%2C%20I%20have%20a%20question%20about%20your%20event%20rental%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 p-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                <ChatBotIcon className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-muted-foreground text-lg font-medium">
                  Still have questions?
                </p>
                <p className="text-sm text-muted-foreground">
                  Chat with our customer service
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
