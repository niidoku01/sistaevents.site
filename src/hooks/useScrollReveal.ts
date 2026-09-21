import { useEffect } from "react";

const STAGGER_MS = 80;

export const useScrollReveal = () => {
  useEffect(() => {
    let idleId = 0;
    let frameId = 0;
    let scrollFrame = 0;
    let observer: IntersectionObserver | null = null;

    const revealNode = (node: HTMLElement) => {
      node.classList.add("is-visible");
      observer?.unobserve(node);
    };

    // Fail-safe: reveal anything already in (or near) the viewport even when
    // IntersectionObserver misses elements (fast touch scroll, tall sections
    // that never hit the old visibility threshold on small screens).
    const revealIfInViewport = (nodes: HTMLElement[], threshold = 0.94) => {
      const limit = window.innerHeight * threshold + 64;
      for (const node of nodes) {
        if (node.classList.contains("is-visible")) continue;
        const rect = node.getBoundingClientRect();
        if (rect.top < limit && rect.bottom > -64) revealNode(node);
      }
    };

    const handleScroll = (nodes: HTMLElement[]) => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => revealIfInViewport(nodes));
    };

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

      revealIfInViewport(revealNodes);
      const onScroll = () => handleScroll(revealNodes);
      window.addEventListener("scroll", onScroll, { passive: true });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) revealNode(entry.target as HTMLElement);
          });
        },
        { threshold: 0.01, rootMargin: "0px 0px 6% 0px" }
      );

      revealNodes.forEach((node) => observer?.observe(node));

      return onScroll;
    };

    let removeScroll: (() => void) | null = null;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        removeScroll = bootstrap();
      }, { timeout: 350 });
    } else {
      removeScroll = bootstrap();
    }

    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (frameId) window.cancelAnimationFrame(frameId);
      if (removeScroll) removeScroll();
      observer?.disconnect();
    };
  }, []);
};