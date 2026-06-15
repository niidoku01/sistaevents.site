import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

const POPUP_DISMISS_KEY = "homepagePopupDismissedAt";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 12;
const ANIMATION_DURATION_MS = 300;

const PopupAdWithConvex = () => {
  const ad = useQuery(api.popupAds.getActivePopupAd);
  const [open, setOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const navigate = useNavigate();
  const closeTimeoutRef = useRef<number | null>(null);
  const openRafRef = useRef<number | null>(null);

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
      setOpen(true);
      openRafRef.current = requestAnimationFrame(() => {
        openRafRef.current = requestAnimationFrame(() => setAnimateIn(true));
      });
    }

    return () => {
      if (openRafRef.current !== null) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, [ad, canShow]);

  const handleClose = () => {
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
  };

  const handleCtaClick = () => {
    handleClose();
    setTimeout(() => {
      navigate("/");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, ANIMATION_DURATION_MS);
  };

  if (!ad || !open || !ad.imageUrl) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center p-3 backdrop-blur-[2px] sm:items-center sm:p-6 transition-all duration-300 ease-out ${
        animateIn ? "bg-slate-950/45" : "bg-transparent pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`relative w-full max-w-[min(100vw-1.5rem,420px)] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl mt-16 sm:mt-0 transition-all duration-300 ease-out ${
          animateIn ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        <button
          onClick={handleClose}
          aria-label="Close popup ad"
          className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/70 p-1.5 text-white transition-colors hover:bg-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[16/10] w-full bg-slate-100">
          <img
            src={ad.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            sizes="(max-width: 640px) 100vw, 420px"
            width={420}
            height={263}
          />
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white px-4 py-4 sm:px-5">
          <button
            onClick={handleCtaClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-80"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export const PopupAd = () => {
  return <PopupAdWithConvex />;
};
