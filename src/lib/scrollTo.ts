// Precise, fast scrolling to a section that accounts for the fixed glass
// header (`scroll-margin-top`), waits for the element to render (cross-page
// navigation), and re-settles if lazy images shift the layout after landing.

const ELEMENT_WAIT_MS = 2600;
const SETTLE_ATTEMPTS = 4;
const SETTLE_INTERVAL_MS = 120;

const marginTopOf = (el: HTMLElement): number => {
  const value = getComputedStyle(el).scrollMarginTop || "0";
  return Math.max(Number.parseFloat(value) || 0, 0);
};

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const behaviorFor = (behavior: ScrollBehavior): ScrollBehavior =>
  prefersReducedMotion() ? "auto" : behavior;

const targetTop = (el: HTMLElement): number =>
  Math.max(el.getBoundingClientRect().top + window.scrollY - marginTopOf(el), 0);

export const driveTo = (el: HTMLElement, behavior: ScrollBehavior = "smooth"): void => {
  window.scrollTo({ top: targetTop(el), behavior: behaviorFor(behavior) });
};

const driveAndSettle = (el: HTMLElement): void => {
  let attempts = 0;
  let lastTop: number | null = null;

  const settle = () => {
    const top = targetTop(el);
    const settled = lastTop !== null && Math.abs(top - lastTop) < 2;
    lastTop = top;
    window.scrollTo({ top, behavior: behaviorFor("smooth") });

    // Keep correcting while lazy images / content change the section position.
    if (!settled && attempts < SETTLE_ATTEMPTS) {
      attempts += 1;
      window.setTimeout(settle, SETTLE_INTERVAL_MS);
    }
  };

  settle();
};

export const scrollToId = (
  id: string,
  signal?: { cancelled?: boolean }
): void => {
  const start = performance.now();

  const attempt = () => {
    if (signal?.cancelled) return;
    const el = document.getElementById(id);
    if (!el) {
      // The section may still be rendering (e.g. after a cross-page navigate).
      if (performance.now() - start < ELEMENT_WAIT_MS) {
        window.setTimeout(attempt, 50);
      }
      return;
    }
    driveAndSettle(el);
  };

  attempt();
};