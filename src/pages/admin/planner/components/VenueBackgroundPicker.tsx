import React from "react";
import { VENUE_BACKGROUNDS } from "../constants";

interface VenueBackgroundPickerProps {
  venueBg: string;
  setVenueBg: (id: string) => void;
  showBgPicker: boolean;
  setShowBgPicker: (v: boolean) => void;
}

export default function VenueBackgroundPicker({ venueBg, setVenueBg, showBgPicker, setShowBgPicker }: VenueBackgroundPickerProps) {
  if (!showBgPicker) return null;

  return (
    <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-2 w-56">
      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 px-1">Interior</p>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {VENUE_BACKGROUNDS.filter((b) => b.group === "Interior").map((b) => {
          const Icon = b.icon;
          return (
            <button key={b.id} onClick={() => { setVenueBg(b.id); setShowBgPicker(false); }}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-[9px] transition-colors ${venueBg === b.id ? "bg-amber-100 text-amber-700 border border-amber-300" : "hover:bg-slate-50 text-slate-600 border border-transparent"}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 px-1">Exterior</p>
      <div className="grid grid-cols-3 gap-1">
        {VENUE_BACKGROUNDS.filter((b) => b.group === "Exterior").map((b) => {
          const Icon = b.icon;
          return (
            <button key={b.id} onClick={() => { setVenueBg(b.id); setShowBgPicker(false); }}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-[9px] transition-colors ${venueBg === b.id ? "bg-amber-100 text-amber-700 border border-amber-300" : "hover:bg-slate-50 text-slate-600 border border-transparent"}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
