import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers! Find quick answers to common questions about our services.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <a
              href="https://wa.me/0279689522?text=Hi%2C%20I%20have%20a%20question%20about%20your%20event%20rental%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-semibold"
            >
              Chat with us on WhatsApp →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
