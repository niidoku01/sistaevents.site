import { useEffect, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const POPUP_DISMISS_KEY = "homepagePopupDismissedAt";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 12;
const ANIMATION_DURATION_MS = 400;

const PopupAdWithConvex = () => {
  const ad = useQuery(api.popupAds.getActivePopupAd);
  const [open, setOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    let timer: number | undefined;
    const hasSearch = Boolean(location.search && location.search.length > 1);

    if (ad && canShow) {
      if (hasSearch) {
        timer = window.setTimeout(() => {
          setOpen(true);
          requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
        }, 3000);
      } else {
        setOpen(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [ad, canShow, location.search]);

  const handleClose = () => {
    setAnimatingOut(true);
    setAnimateIn(false);
    setTimeout(() => {
      setOpen(false);
      setAnimatingOut(false);
      try {
        localStorage.setItem(POPUP_DISMISS_KEY, String(Date.now()));
      } catch {
        // Ignore storage failures and still close the popup.
      }
    }, ANIMATION_DURATION_MS);
  };

  if (location.pathname.startsWith("/admin")) return null;
  if (!ad || !open) return null;

  const handleGoToBookings = () => {
    handleClose();
    setTimeout(() => {
      navigate("/");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, ANIMATION_DURATION_MS);
  };

  const handleGoToCta = () => {
    if (ad.ctaUrl) {
      window.open(ad.ctaUrl, "_blank");
    }
    handleClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ease-out ${
        animateIn ? "bg-black/50 backdrop-blur-sm" : "bg-transparent pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={ad.title || "Featured popup"}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-out ${
          animateIn ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        <button
          onClick={handleClose}
          aria-label="Close popup"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        {ad.imageUrl && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
            <img
              src={ad.imageUrl}
              alt={ad.title || "Promotional image"}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              sizes="(max-width: 640px) calc(100vw - 1.5rem), 512px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
        )}

        <div className="space-y-4 p-5 sm:p-6">
          {ad.title && (
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {ad.title}
            </h2>
          )}

          {ad.message && (
            <p className="text-sm leading-relaxed text-slate-600">
              {ad.message}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {ad.ctaText ? (
              <Button
                onClick={handleGoToCta}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {ad.ctaText}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGoToBookings}
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 font-medium"
              >
                Book Now
              </Button>
            )}

            <button
              onClick={handleClose}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PopupAd = () => {
  return <PopupAdWithConvex />;
};
