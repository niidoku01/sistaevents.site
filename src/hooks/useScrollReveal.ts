import { useEffect } from "react";

const STAGGER_MS = 80;

export const useScrollReveal = () => {
  useEffect(() => {
    let idleId = 0;
    let frameId = 0;
    let observer: IntersectionObserver | null = null;

    const bootstrap = () => {
      const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      const staggerContainers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal-stagger]")
      );

      frameId = window.requestAnimationFrame(() => {
        staggerContainers.forEach((container) => {
          const items = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal-item]"));
          items.forEach((item, index) => {
            item.style.setProperty("--reveal-delay", `${index * STAGGER_MS}ms`);
          });
        });
      });

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        revealNodes.forEach((node) => node.classList.add("is-visible"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
      );

      revealNodes.forEach((node) => observer?.observe(node));
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(bootstrap, { timeout: 350 });
    } else {
      bootstrap();
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (frameId) window.cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, []);
};