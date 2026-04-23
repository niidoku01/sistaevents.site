import { useEffect, useRef } from "react";

export const ScrollProgress = () => {
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frameId = 0;
    let maxScroll = 1;

    const updateMaxScroll = () => {
      maxScroll = Math.max(
        document.documentElement.scrollHeight - document.documentElement.clientHeight,
        1
      );
    };

    const paintProgress = () => {
      const scrollTop = window.pageYOffset;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      frameId = 0;
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(paintProgress);
    };

    updateMaxScroll();
    paintProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMaxScroll);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMaxScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted/30 z-50">
      <div
        ref={progressRef}
        className="h-full bg-gradient-to-r from-accent to-primary origin-left will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
};
