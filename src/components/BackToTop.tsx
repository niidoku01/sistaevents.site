import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const getScrollTop = () =>
  window.scrollY ||
  window.pageYOffset ||
  document.documentElement.scrollTop ||
  document.body.scrollTop ||
  0;

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      setIsVisible(getScrollTop() > 300);
      raf = window.requestAnimationFrame(update);
    };
    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`floating-icon-backtotop fixed left-4 sm:left-6 z-[70] bg-accent hover:bg-accent/90 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 floating-icon-pop opacity-100 translate-y-0 pointer-events-auto ${
        isVisible ? "" : "sm:opacity-0 sm:translate-y-4 sm:pointer-events-none"
      }`}
      tabIndex={0}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
