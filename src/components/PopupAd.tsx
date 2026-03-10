import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const POPUP_DISMISS_KEY = "homepagePopupDismissedAt";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 12;

export const PopupAd = () => {
  const ad = useQuery(api.popupAds.getActiveAd, {});
  const [open, setOpen] = useState(false);

  const canShow = useMemo(() => {
    const dismissedAt = Number(localStorage.getItem(POPUP_DISMISS_KEY) || "0");
    if (!dismissedAt) return true;
    return Date.now() - dismissedAt > DISMISS_DURATION_MS;
  }, []);

  useEffect(() => {
    setOpen(Boolean(ad) && canShow);
  }, [ad, canShow]);

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      localStorage.setItem(POPUP_DISMISS_KEY, String(Date.now()));
    }
  };

  if (!ad || !open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[300px] sm:w-[340px] rounded-xl border border-amber-200 bg-white shadow-xl overflow-hidden">
      <button
        onClick={() => handleClose(false)}
        aria-label="Close popup ad"
        className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white p-1 hover:bg-black/75"
      >
        <X className="w-4 h-4" />
      </button>

      <Link to="/" className="block bg-gradient-to-br from-amber-50 to-white">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover" />
        ) : null}

        <div className="p-3">
          <h3 className="text-base font-semibold text-slate-900 mb-1">{ad.title}</h3>
          <p className="text-xs text-slate-700 line-clamp-3 mb-2">{ad.message}</p>
          <span className="text-xs font-medium text-amber-700">Tap ad to go to homepage</span>
        </div>
      </Link>
    </div>
  );
};
