import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { ConfettiBurst } from "@/components/ConfettiBurst";

const POPUP_DISMISS_KEY = "homepagePopupDismissedAt";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 12;
const ANIMATION_DURATION_MS = 300;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const PopupAdWithConvex = () => {
  const ad = useQuery(api.popupAds.getActivePopupAd);
  const [open, setOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const navigate = useNavigate();
  const closeTimeoutRef = useRef<number | null>(null);
  const openRafRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Cleanup timeouts / animation frames on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      if (openRafRef.current !== null) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const dismissedAt = Number(localStorage.getItem(POPUP_DISMISS_KEY) || "0");
      if (!dismissedAt) {
        setCanShow(true);
        return;
      }
      setCanShow(Date.now() - dismissedAt > DISMISS_DURATION_MS);
    } catch {
      setCanShow(true);
    }
  }, []);

  useEffect(() => {
    if (ad && canShow && ad.imageUrl) {
      setOpen(false);
      setAnimateIn(false);
      // Small delay to ensure clean animation restart
      const startTimeout = window.setTimeout(() => {
        setOpen(true);
        openRafRef.current = requestAnimationFrame(() => {
          openRafRef.current = requestAnimationFrame(() => {
            setAnimateIn(true);
          });
        });
      }, 50);

      return () => {
        window.clearTimeout(startTimeout);
        if (openRafRef.current !== null) {
          cancelAnimationFrame(openRafRef.current);
          openRafRef.current = null;
        }
      };
    } else if (!ad) {
      setOpen(false);
      setAnimateIn(false);
    }

    return () => {
      if (openRafRef.current !== null) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, [ad, canShow, ad?._id]);

  const handleClose = useCallback(() => {
    setAnimateIn(false);
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      try {
        localStorage.setItem(POPUP_DISMISS_KEY, String(Date.now()));
      } catch {
        // Ignore storage failures.
      }
      closeTimeoutRef.current = null;
    }, ANIMATION_DURATION_MS);
  }, []);

  // Lock background scrolling, focus the close button, and support Escape /
  // keyboard focus cycling while the dialog is open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, handleClose]);

  const handleCtaClick = () => {
    const ctaUrl = ad?.ctaUrl?.trim() ?? "";
    handleClose();
    setTimeout(() => {
      if (/^https?:\/\//i.test(ctaUrl)) {
        window.location.assign(ctaUrl);
        return;
      }
      navigate("/");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, ANIMATION_DURATION_MS);
  };

  if (!ad || !open || !ad.imageUrl) return null;

  const title = ad.title?.trim() ?? "";
  const message = ad.message?.trim() ?? "";
  const ctaText = ad.ctaText?.trim() || "Book Now";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center ${ad.celebratory ? "overflow-visible" : "overflow-hidden"} p-3 backdrop-blur-[2px] sm:items-center sm:p-6 transition-all duration-300 ease-out ${
        animateIn ? "bg-slate-950/45" : "bg-transparent"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "popup-ad-title" : undefined}
      aria-describedby={message ? "popup-ad-message" : undefined}
      aria-label={title ? undefined : "Promotion"}
      onClick={handleClose}
    >
      {ad.celebratory && animateIn && (
        <ConfettiBurst className="absolute inset-0 z-30" count={130} distance="130vh" />
      )}

      <div
        ref={dialogRef}
        className={`relative z-10 w-full max-w-[min(100vw-1.5rem,420px)] overflow-hidden rounded-2xl border bg-white shadow-2xl mt-16 sm:mt-0 will-change-transform ${
          ad.celebratory
            ? "border-amber-300 ring-2 ring-amber-300/60 shadow-[0_0_60px_rgba(251,191,36,0.45)]"
            : "border-amber-200"
        } ${animateIn ? "animate-bounce-in" : "scale-90 opacity-0 translate-y-6"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label="Close popup ad"
          className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/70 p-1.5 text-white transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <img
            src={ad.imageUrl}
            alt={title || "Promotion"}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
            sizes="(max-width: 640px) 100vw, 420px"
            width={420}
            height={263}
          />
        </div>

        <div className="bg-linear-to-br from-amber-50 to-white px-4 py-4 sm:px-5">
          {(title || message) && (
            <div className="mb-3 text-center">
              {title && (
                <h2 id="popup-ad-title" className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
                  {title}
                </h2>
              )}
              {message && (
                <p id="popup-ad-message" className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {message}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCtaClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-slate-800 active:scale-95 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PopupAd = () => {
  return <PopupAdWithConvex />;
};
