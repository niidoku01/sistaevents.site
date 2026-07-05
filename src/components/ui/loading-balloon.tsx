"use client";

import sistaLogo from "@/assets/sistalogo.svg";

const SPARKLES = [
  { dx: 30, dy: -40, delay: "0.6s", size: 3 },
  { dx: -35, dy: -30, delay: "0.7s", size: 2 },
  { dx: 40, dy: 10, delay: "0.8s", size: 3 },
  { dx: -30, dy: 20, delay: "0.65s", size: 2 },
  { dx: 20, dy: -45, delay: "0.75s", size: 2 },
  { dx: -25, dy: -40, delay: "0.85s", size: 3 },
  { dx: 45, dy: -15, delay: "0.9s", size: 2 },
  { dx: -40, dy: -5, delay: "0.55s", size: 2 },
];

export const LoadingBalloon = () => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated gradient glow behind logo */}
        <div className="absolute -inset-10 animate-[glowPulse_2s_ease-in-out_infinite] rounded-full bg-gradient-radial from-accent/20 via-accent/5 to-transparent sm:-inset-12" />

        {/* Sparkle particles */}
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            className="absolute animate-[sparkle_1s_ease-out_forwards]"
            style={{
              "--dx": `${s.dx}px`,
              "--dy": `${s.dy}px`,
              animationDelay: s.delay,
              width: s.size,
              height: s.size,
              backgroundColor: "hsl(40 95% 55%)",
              borderRadius: "50%",
              opacity: 0,
              boxShadow: "0 0 4px hsl(40 95% 55% / 0.8)",
            } as React.CSSProperties}
          />
        ))}

        {/* Logo with balloon inflation */}
        <div className="animate-[inflateBalloon_2s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24">
            <img
              src={sistaLogo}
              alt="Sista Events"
              className="h-full w-full object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Text & progress bar */}
        <div className="mt-6 flex animate-[fadeInUp_0.7s_ease-out_1.4s_forwards] flex-col items-center gap-2 opacity-0 sm:mt-8">
          <p className="text-xs font-semibold tracking-wider text-foreground/80 sm:text-sm">
            Sista Events & Rentals
          </p>

          {/* Progress bar */}
          <div className="h-0.5 w-28 overflow-hidden rounded-full bg-border sm:w-36">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent animate-[progressFill_2.8s_ease-in-out_0.3s_forwards]"
              style={{ width: "0%" }}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Loading</span>
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-[bounce_1.4s_ease-in-out_infinite_0ms] rounded-full bg-accent" />
              <span className="h-1 w-1 animate-[bounce_1.4s_ease-in-out_infinite_200ms] rounded-full bg-accent" />
              <span className="h-1 w-1 animate-[bounce_1.4s_ease-in-out_infinite_400ms] rounded-full bg-accent" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
