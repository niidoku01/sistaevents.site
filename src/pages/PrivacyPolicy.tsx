import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Lock, ShieldCheck, Trash2, Mail } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-slate-100 via-white to-slate-50 py-10 sm:py-14">
          <div className="container mx-auto px-4 lg:px-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Data Protection</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: September 21, 2026</p>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Sista Events &amp; Rentals ("we", "our", or "us") respects your privacy and is committed to protecting
              your personal data. This policy explains what we collect, why we collect it, how it is safeguarded, and
              what rights you have. It applies to sistaevents.site and the services we provide.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-6 max-w-3xl py-10 sm:py-14 space-y-10">
          <Section title="Information we collect">
            <p>
              When you use our booking form or submit a review, we collect only the information you choose to provide:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Your name, to address you correctly.</li>
              <li>Your email address, to confirm your enquiry and respond to you.</li>
              <li>Your phone number (optional), to contact you about your event.</li>
              <li>Event details: date, type, and any message describing your needs.</li>
              <li>For reviews: your name, event type, rating, and review text, which we publish after approval.</li>
            </ul>
            <p>
              Like most websites, our hosting provider (Vercel) and database service (Convex) automatically record
              technical details such as your IP address, browser type, and pages visited for security and reliability.
              We do not run advertising or tracking analytics on this website.
            </p>
          </Section>

          <Section title="Why we process your data and our lawful basis">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="font-medium text-foreground">Consent:</span> we only store and use your enquiry or
                review details after you explicitly tick the consent box on the form (Article 6(1)(a) of the GDPR).
                You can withdraw consent at any time.
              </li>
              <li>
                <span className="font-medium text-foreground">Contract / pre-contractual steps:</span> processing your
                booking request to prepare a quote or plan your event (Article 6(1)(b)).
              </li>
              <li>
                <span className="font-medium text-foreground">Legitimate interests:</span> protecting the website from
                abuse and fraud, and keeping records of what we were asked to provide.
              </li>
            </ul>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To respond to, confirm, and manage your booking requests.</li>
              <li>To notify our team of a new enquiry (an email alert is sent to our business inbox).</li>
              <li>To publish approved reviews publicly, so other clients can see honest feedback.</li>
              <li>To keep the website secure and available.</li>
            </ul>
          </Section>

          <Section title="Where your data is stored">
            <p>
              Booking and review records are stored in our Convex database. Admin sign-in uses Firebase Authentication
              (Google) — only for staff accessing the private admin area. Email notifications are delivered through
              Resend. If you contact us on WhatsApp, your conversation is governed by WhatsApp's own privacy policy,
              which we encourage you to review.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep booking records as long as a service relationship is active, and afterwards for only as long as
              needed to meet legal, accounting, or tax obligations. Review records are kept until you ask us to remove
              them. When admins delete a record in the admin area, it is permanently erased from the database. Pending
              reviews that are never approved are removed when the reviewer requests it.
            </p>
          </Section>

          <Section title="Your rights">
            <p>Under the GDPR and Ghana's Data Protection Act, 2012 (Act 843), you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access a copy of the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request erasure of your data ("right to be forgotten").</li>
              <li>Restrict how we process your data in certain circumstances.</li>
              <li>Receive your data in a portable, structured format.</li>
              <li>Object to certain processing, and withdraw your consent at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href="mailto:info@sistaevents.com" className="text-accent font-medium underline underline-offset-2">
                info@sistaevents.com
              </a>
              . We will respond within one month.
            </p>
          </Section>

          <Section title="Cookies and local storage">
            <p>
              This website does not use advertising or tracking cookies. We use browser local storage only for
              functionality, such as remembering that you dismissed a promotional popup, temporarily pre-filling a
              form, or saving work in your own admin tools. This data stays on your device and can be cleared via your
              browser's privacy settings.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Our services are not directed at children under 13, and we do not knowingly collect personal data from
              children. If you believe a child has provided us with personal data, please contact us so we can remove
              it.
            </p>
          </Section>

          <Section title="International transfers">
            <p>
              Our providers (Convex, Vercel, Resend, Google) may store or process data in regions outside your country
              of residence. We rely on providers that offer appropriate safeguards (including EU standard
              contractual clauses where applicable) for such transfers.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Any changes will be posted on this page with an updated
              "Last updated" date.
            </p>
          </Section>

          <Section title="Contact us">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:info@sistaevents.com"
                className="inline-flex items-center gap-2 rounded-xl bg-white/80 border border-white/60 px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <Mail className="w-4 h-4 text-accent" /> info@sistaevents.com
              </a>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 border border-white/60 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                <ShieldCheck className="w-4 h-4 text-accent" /> Data Protection Compliant
              </span>
            </div>
          </Section>

          <div className="rounded-2xl border border-border/70 bg-white/70 backdrop-blur p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-muted-foreground">
            <Lock className="w-5 h-5 text-accent flex-shrink-0" />
            <p>
              If you believe we have not handled your data properly, you may lodge a complaint with your local data
              protection authority (in Ghana, the Data Protection Commission). This policy complies with the GDPR, the
              Ghana Data Protection Act, 2012 (Act 843), and, for California residents, the CCPA.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground/80">
            <Trash2 className="w-4 h-4 text-accent" />
            <span>
              Want your information deleted?{" "}
              <Link to="/" className="text-accent font-medium underline underline-offset-2 hover:opacity-80">
                Contact us
              </Link>{" "}
              with the email you used.
            </span>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
      <WhatsAppButton phoneNumber="+233279689522" />
    </div>
  );
}