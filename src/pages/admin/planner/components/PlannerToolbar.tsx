import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Download, ZoomIn, ZoomOut, RotateCcw, Save,
  Grid3x3, Users, Wand2, Undo2, Box, Maximize2,
} from "lucide-react";
import { VENUE_BACKGROUNDS } from "../constants";
import VenueBackgroundPicker from "./VenueBackgroundPicker";

interface PlannerToolbarProps {
  eventName: string;
  setEventName: (v: string) => void;
  totalGuests: number;
  scale: number;
  setScale: (fn: (s: number) => number) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  show3D: boolean;
  setShow3D: (v: boolean) => void;
  venueBg: string;
  setVenueBg: (id: string) => void;
  showBgPicker: boolean;
  setShowBgPicker: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleAutoArrange: () => void;
  savePlan: () => void;
  exportPNG: () => void;
  clearAll: () => void;
  currentBg: typeof VENUE_BACKGROUNDS[0];
  onPreview3D?: () => void;
  compact?: boolean;
}

export default function PlannerToolbar({
  eventName, setEventName, totalGuests,
  scale, setScale, showGrid, setShowGrid,
  show3D, setShow3D, venueBg, setVenueBg,
  showBgPicker, setShowBgPicker,
  undo, redo, canUndo, canRedo,
  handleAutoArrange, savePlan, exportPNG, clearAll,
  currentBg, onPreview3D, compact,
}: PlannerToolbarProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-sm px-2 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-none min-w-0">
        {!compact && (
          <Input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="max-w-[160px] sm:max-w-xs text-sm font-semibold rounded-xl border-slate-200/80 focus:border-indigo-400 focus:ring-indigo-400/20 flex-shrink-0"
            placeholder="Event name"
          />
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50/80 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">~{totalGuests}</span>
          <span className="text-slate-400">guests</span>
        </div>

        <div className="flex-1 min-w-0" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={undo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={redo} disabled={!canRedo} title="Redo"><RotateCcw className="w-4 h-4" /></TbBtn>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={() => setScale((s) => Math.max(0.3, s - 0.15))} title="Zoom out"><ZoomOut className="w-4 h-4" /></TbBtn>
          <span className="text-xs text-slate-500 font-mono w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <TbBtn onClick={() => setScale((s) => Math.min(3, s + 0.15))} title="Zoom in"><ZoomIn className="w-4 h-4" /></TbBtn>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={() => setShowGrid(!showGrid)} active={showGrid} title="Grid"><Grid3x3 className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={() => setShow3D(!show3D)} active={show3D} title="3D Preview"><Box className="w-4 h-4" /></TbBtn>
          <div className="relative">
            <TbBtn onClick={() => setShowBgPicker(!showBgPicker)} active={venueBg !== "default"} title="Venue background">
              {React.createElement(currentBg.icon, { className: "w-4 h-4" })}
            </TbBtn>
            <VenueBackgroundPicker venueBg={venueBg} setVenueBg={setVenueBg} showBgPicker={showBgPicker} setShowBgPicker={setShowBgPicker} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={handleAutoArrange} title="AI Auto-arrange"><Wand2 className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={savePlan} title="Save"><Save className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={exportPNG} title="Export 2D PNG"><Download className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={clearAll} title="Clear all" variant="danger"><Trash2 className="w-4 h-4" /></TbBtn>
        </div>

        {/* 3D Preview - prominent */}
        {onPreview3D && (
          <button
            onClick={onPreview3D}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-md shadow-purple-500/20 transition-all duration-200 active:scale-95 uppercase tracking-wider flex-shrink-0"
            title="View full 3D floor plan"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview 3D</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TbBtn({ onClick, disabled, title, children, active, variant }: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <Button
      variant="ghost" size="sm"
      className={`h-8 w-8 p-0 rounded-xl transition-all duration-150
        ${variant === "danger"
          ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
          : active
            ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }
        disabled:opacity-30 disabled:pointer-events-none active:scale-90`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}
