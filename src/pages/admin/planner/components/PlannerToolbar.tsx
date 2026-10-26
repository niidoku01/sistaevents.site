import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Download, ZoomIn, ZoomOut, RotateCcw, Save,
  Grid3x3, Users, Shuffle, Undo2, Box, Maximize2, LayoutGrid, Columns2,
  MoreHorizontal, Scan,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VENUE_BACKGROUNDS } from "../constants";
import VenueBackgroundPicker from "./VenueBackgroundPicker";
import type { ViewMode } from "../types";

interface PlannerToolbarProps {
  eventName: string;
  setEventName: (v: string) => void;
  totalGuests: number;
  scale: number;
  setScale: (fn: (s: number) => number) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
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
  fitToView: () => void;
  currentBg: typeof VENUE_BACKGROUNDS[0];
  onPreview3D?: () => void;
  compact?: boolean;
}

export default function PlannerToolbar({
  eventName, setEventName, totalGuests,
  scale, setScale, showGrid, setShowGrid,
  viewMode, setViewMode, venueBg, setVenueBg,
  showBgPicker, setShowBgPicker,
  undo, redo, canUndo, canRedo,
  handleAutoArrange, savePlan, exportPNG, clearAll, fitToView,
  currentBg, onPreview3D, compact,
}: PlannerToolbarProps) {
  const BackgroundIcon = currentBg.icon;

  // ─── Mobile: one compact row + overflow menu ──────────────
  if (compact) {
    return (
      <div className="rounded-2xl border border-slate-200/50 bg-white/85 px-1.5 py-1.5 shadow-xs backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
            {/* Undo / Redo */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-slate-50/80 p-0.5">
              <TbBtn onClick={undo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></TbBtn>
              <TbBtn onClick={redo} disabled={!canRedo} title="Redo"><RotateCcw className="w-4 h-4" /></TbBtn>
            </div>

            {/* Zoom */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-slate-50/80 px-0.5">
              <TbBtn onClick={() => setScale((s) => Math.max(0.2, s - 0.15))} title="Zoom out"><ZoomOut className="w-4 h-4" /></TbBtn>
              <button
                onClick={() => setScale(() => 1)}
                title="Reset zoom to 100%"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[11px] font-mono text-slate-500 tabular-nums transition-colors hover:bg-slate-100 hover:text-indigo-600"
              >
                {Math.round(scale * 100)}%
              </button>
              <TbBtn onClick={() => setScale((s) => Math.min(4, s + 0.15))} title="Zoom in"><ZoomIn className="w-4 h-4" /></TbBtn>
            </div>

            {/* View mode: 2D / 3D (Split lives in the overflow menu) */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-slate-50/80 p-0.5">
              <ViewBtn active={viewMode === "2d"} onClick={() => setViewMode("2d")} compact icon={<LayoutGrid className="w-3.5 h-3.5" />} label="2D" />
              <ViewBtn active={viewMode === "3d"} onClick={() => setViewMode("3d")} compact icon={<Box className="w-3.5 h-3.5" />} label="3D" />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="More planner actions"
                className="h-11 w-11 shrink-0 rounded-xl p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Plan
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={fitToView} className="gap-2 text-xs">
                <Scan className="h-3.5 w-3.5" /> Fit plan to screen
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleAutoArrange} className="gap-2 text-xs">
                <Shuffle className="h-3.5 w-3.5" /> Auto-arrange
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={showGrid}
                onCheckedChange={(checked) => setShowGrid(Boolean(checked))}
                className="text-xs"
              >
                Show grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem
                onSelect={() => setShowBgPicker(!showBgPicker)}
                className="gap-2 text-xs"
              >
                <BackgroundIcon className="h-3.5 w-3.5" /> Venue background
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                View
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setViewMode("split")} className="gap-2 text-xs">
                <Columns2 className="h-3.5 w-3.5" /> Split 2D / 3D
              </DropdownMenuItem>
              {onPreview3D && (
                <DropdownMenuItem onSelect={onPreview3D} className="gap-2 text-xs">
                  <Maximize2 className="h-3.5 w-3.5" /> Preview 3D fullscreen
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={savePlan} className="gap-2 text-xs">
                <Save className="h-3.5 w-3.5" /> Save plan
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportPNG} className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5" /> Export 2D PNG
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={clearAll}
                className="gap-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear floor plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showBgPicker && (
          <VenueBackgroundPicker
            venueBg={venueBg}
            setVenueBg={setVenueBg}
            showBgPicker={showBgPicker}
            setShowBgPicker={setShowBgPicker}
          />
        )}
      </div>
    );
  }

  // ─── Desktop / tablet: full toolbar ───────────────────────
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xs px-2 py-2 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 gap-y-2 min-w-0 touch-manipulation">
        <Input
          aria-label="Event name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="max-w-[160px] sm:max-w-xs text-sm font-semibold rounded-xl border-slate-200/80 focus:border-indigo-400 focus:ring-indigo-400/20 flex-shrink-0"
          placeholder="Event name"
        />
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50/80 px-2.5 py-2 sm:py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">~{totalGuests}</span>
          <span className="text-slate-400">guests</span>
        </div>

        <div className="flex-1 min-w-0 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={undo} disabled={!canUndo} title="Undo"><Undo2 className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={redo} disabled={!canRedo} title="Redo"><RotateCcw className="w-4 h-4" /></TbBtn>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={() => setScale((s) => Math.max(0.2, s - 0.15))} title="Zoom out"><ZoomOut className="w-4 h-4" /></TbBtn>
          <button
            onClick={() => setScale(() => 1)}
            title="Reset zoom to 100%"
            className="text-xs text-slate-500 font-mono w-10 h-11 sm:h-8 text-center tabular-nums hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >{Math.round(scale * 100)}%</button>
          <TbBtn onClick={() => setScale((s) => Math.min(4, s + 0.15))} title="Zoom in"><ZoomIn className="w-4 h-4" /></TbBtn>
        </div>

        {/* View mode: 2D / 3D / Split */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl p-0.5 flex-shrink-0" title="View mode">
          <ViewBtn active={viewMode === "2d"} onClick={() => setViewMode("2d")} icon={<LayoutGrid className="w-3.5 h-3.5" />} label="2D" />
          <ViewBtn active={viewMode === "3d"} onClick={() => setViewMode("3d")} icon={<Box className="w-3.5 h-3.5" />} label="3D" />
          <ViewBtn active={viewMode === "split"} onClick={() => setViewMode("split")} icon={<Columns2 className="w-3.5 h-3.5" />} label="Split" />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={() => setShowGrid(!showGrid)} active={showGrid} title="Grid"><Grid3x3 className="w-4 h-4" /></TbBtn>
          <div className="relative">
            <TbBtn onClick={() => setShowBgPicker(!showBgPicker)} active={venueBg !== "default"} title="Venue background">
              <BackgroundIcon className="w-4 h-4" />
            </TbBtn>
            <VenueBackgroundPicker venueBg={venueBg} setVenueBg={setVenueBg} showBgPicker={showBgPicker} setShowBgPicker={setShowBgPicker} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 bg-slate-50/80 rounded-xl px-1 py-0.5 flex-shrink-0">
          <TbBtn onClick={fitToView} title="Fit plan to screen"><Scan className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={handleAutoArrange} title="Auto-arrange"><Shuffle className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={savePlan} title="Save"><Save className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={exportPNG} title="Export 2D PNG"><Download className="w-4 h-4" /></TbBtn>
          <TbBtn onClick={clearAll} title="Clear all" variant="danger"><Trash2 className="w-4 h-4" /></TbBtn>
        </div>

        {/* 3D Preview - prominent */}
        {onPreview3D && (
          <button
            onClick={onPreview3D}
            className="flex items-center gap-1.5 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[11px] font-bold px-3 h-11 sm:h-9 rounded-xl shadow-md shadow-purple-500/20 transition-all duration-200 active:scale-95 uppercase tracking-wider flex-shrink-0"
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

function ViewBtn({ active, onClick, icon, label, compact }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-lg font-bold uppercase tracking-wider transition-all duration-150 flex-shrink-0 ${
        compact ? "h-11 px-2.5 text-[10px]" : "h-11 sm:h-8 px-2 text-[10px]"
      } ${active ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
    >
      {icon}
      {label}
    </button>
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
      aria-label={title}
      className={`h-11 w-11 sm:h-8 sm:w-8 p-0 rounded-xl transition-all duration-150
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
