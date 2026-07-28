"use client";

import sistaLogo from "@/assets/sistalogo.svg";

export const LoadingBalloon = () => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative flex flex-col items-center">
        {/* Glow behind logo */}
        <div className="absolute -inset-8 sm:-inset-10 animate-[glowPulse_2.5s_ease-in-out_infinite] rounded-full bg-gradient-radial from-accent/15 via-accent/5 to-transparent" />

        {/* Logo with balloon inflation */}
        <div className="animate-[balloonInflate_1.8s_cubic-bezier(0.22,1,0.36,1)_forwards] opacity-0">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center">
            <img
              src={sistaLogo}
              alt="Sista Events"
              className="h-full w-full object-contain animate-[logoGlow_2.5s_ease-in-out_infinite_1.8s]"
            />
          </div>
        </div>

        {/* Text & progress bar */}
        <div className="mt-6 flex animate-[fadeInUp_0.7s_ease-out_1.4s_forwards] flex-col items-center gap-2.5 opacity-0 sm:mt-8">
          <p className="text-sm font-bold tracking-wider text-foreground/90 sm:text-base">
            Sista Events & Rentals
          </p>

          {/* Progress bar */}
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-border sm:w-40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent animate-[progressFill_2.8s_ease-in-out_0.3s_forwards]"
              style={{ width: "0%" }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Loading</span>
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
