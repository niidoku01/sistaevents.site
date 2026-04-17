import { useEffect } from "react";

const STAGGER_MS = 80;

export const useScrollReveal = () => {
  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const staggerContainers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal-stagger]")
    );

    staggerContainers.forEach((container) => {
      const items = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal-item]"));
      items.forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${index * STAGGER_MS}ms`);
      });
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    revealNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);
};