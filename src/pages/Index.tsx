import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Featured } from "@/components/Featured";
import { About } from "@/components/About";
import { Packages } from "@/components/Packages";
import { FAQ } from "@/components/FAQ";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { ScrollProgress } from "@/components/ScrollProgress";
import { PopupAd } from "@/components/PopupAd";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();
  const location = useLocation();

  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;

    window.history.replaceState({}, "");

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.state]);

  return (
    <div className="min-h-screen">
      <PopupAd />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <div className="deferred-sections">
          <Services />
          <Featured />
          <About />
          <Packages />
          <FAQ />
          <Testimonials />
          <Contact />
        </div>
      </main>
      <Footer />
      <WhatsAppButton phoneNumber="+233279689522" />
      <BackToTop />
    </div>
  );
};

export default Index;
