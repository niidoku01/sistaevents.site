import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const POPUP_DISMISS_KEY = "homepagePopupDismissedAt";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 12;

type ActivePopupAd = {
  _id: Id<"popupAds">;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  active: boolean;
};

const isExternalUrl = (value: string) => /^https?:\/\//i.test(value);

const PopupAdWithConvex = () => {
  const ad = (useQuery(api.popupAds.getActivePopupAd) ?? null) as ActivePopupAd | null;
  const [open, setOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);

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
    setOpen(Boolean(ad) && canShow);
  }, [ad, canShow]);

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      try {
        localStorage.setItem(POPUP_DISMISS_KEY, String(Date.now()));
      } catch {
        // Ignore storage failures and still close the popup.
      }
    }
  };

  if (!ad || !open) return null;

  const ctaUrl = ad.ctaUrl?.trim();
  const ctaText = ad.ctaText?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ad.title}
    >
      <div className="relative mt-16 w-full max-w-[min(100vw-1.5rem,420px)] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl max-h-[calc(100vh-3rem)] overflow-y-auto sm:mt-0 sm:max-h-[calc(100vh-4rem)]">
        <button
          onClick={() => handleClose(false)}
          aria-label="Close popup ad"
          className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/70 p-1.5 text-white transition-colors hover:bg-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        {ad.imageUrl ? (
          <div className="relative aspect-[16/10] w-full bg-slate-100">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 420px"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-white px-4 py-8 sm:px-6">
            <div className="rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Popup announcement</p>
              <p className="mt-2 text-sm text-slate-600">A new ad is active on the homepage.</p>
            </div>
          </div>
        )}

        <div className="space-y-3 bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Featured notice</p>
            <h3 className="mt-1 text-lg font-semibold leading-tight text-slate-900">{ad.title}</h3>
          </div>

          <p className="text-sm leading-6 text-slate-700 line-clamp-4">{ad.message}</p>

          {ctaText && ctaUrl ? (
            isExternalUrl(ctaUrl) ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {ctaText}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <a
                href={ctaUrl}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {ctaText}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const PopupAd = () => {
  return <PopupAdWithConvex />;
};
