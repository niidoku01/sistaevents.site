import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, RotateCcw, RotateCw, ChevronLeft, ChevronRight,
  MoveHorizontal, MoveVertical, FlipHorizontal, FlipVertical,
  Lock, Unlock, ArrowUp, ArrowDown, ChevronUp, ChevronDown,
  Copy, Minus, Plus,
} from "lucide-react";
import { GRID_SIZE } from "../constants";
import type { PlacedElement } from "../types";

interface SelectionToolbarProps {
  selectedEl: PlacedElement | undefined;
  selectedDef: { label: string } | undefined;
  isTable: boolean;
  scale: number;
  labelInput: { id: string; value: string } | null;
  setLabelInput: (v: { id: string; value: string } | null) => void;
  commitLabel: () => void;
  rotateBy: (id: string, deg: number) => void;
  rotateTo: (id: string, deg: number) => void;
  flipElement: (id: string, axis: "h" | "v") => void;
  setElementSize: (id: string, w: number, h: number) => void;
  scaleElement: (id: string, factor: number) => void;
  lockAspect: boolean;
  setLockAspect: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  sendBackward: () => void;
  bringForward: () => void;
  sendToBack: () => void;
  bringToFront: () => void;
  duplicateSelected: () => void;
  startEditLabel: () => void;
  deleteSelected: () => void;
  updateGuests: (id: string, delta: number) => void;
}

export default function SelectionToolbar({
  selectedEl, selectedDef, isTable, scale,
  labelInput, setLabelInput, commitLabel,
  rotateBy, rotateTo, flipElement,
  setElementSize, scaleElement, lockAspect, setLockAspect,
  undo, redo, canUndo, canRedo,
  sendBackward, bringForward, sendToBack, bringToFront,
  duplicateSelected, startEditLabel, deleteSelected, updateGuests,
}: SelectionToolbarProps) {
  if (!selectedEl) return null;

  const rawLeft = selectedEl.x * scale + (selectedEl.width * scale) + 8;
  const clampedLeft = Math.min(rawLeft, 900);
  const toolbarStyle = { position: "absolute" as const, left: Math.max(4, clampedLeft), top: selectedEl.y * scale, transform: "translateY(-50%)" };

  return (
    <div className="pointer-events-none" style={toolbarStyle}>
      {/* Label editor */}
      {labelInput && (
        <div className={`${isMobile ? "px-3 py-2" : "absolute -top-12 left-0 pointer-events-auto"} flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/60 px-3 py-2`}>
          <span className="text-[10px] font-medium text-slate-500">Label:</span>
          <Input autoFocus value={labelInput.value} onChange={(e) => setLabelInput({ ...labelInput, value: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") commitLabel(); if (e.key === "Escape") setLabelInput(null); }}
            onBlur={commitLabel} className="h-7 text-xs w-40 rounded-lg border-slate-200/80 focus:border-indigo-400" />
        </div>
      )}

      <div className="flex flex-col gap-1 pointer-events-auto">
        {/* Row 1: Name + Guest count */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/50 px-2.5 py-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-bold text-slate-600 px-1">{selectedDef?.label}</span>
          {isTable && (
            <>
              <div className="w-px h-4 bg-slate-200/60" />
              <SbBtn onClick={() => updateGuests(selectedEl.id, -1)} title="Fewer seats"><Minus className="w-3.5 h-3.5" /></SbBtn>
              <span className="text-xs font-mono text-slate-700 w-8 text-center font-bold tabular-nums">{selectedEl.guests ?? (selectedEl.type === "round-table" ? 10 : 8)}</span>
              <SbBtn onClick={() => updateGuests(selectedEl.id, 1)} title="More seats"><Plus className="w-3.5 h-3.5" /></SbBtn>
              <span className="text-[9px] text-slate-400 font-medium">seats</span>
            </>
          )}
        </div>

        {/* Row 2: Rotation */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/50 px-2.5 py-1.5 flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Rotate</span>
          <SbBtn onClick={() => rotateBy(selectedEl.id, -90)} title="Rotate -90"><RotateCcw className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={() => rotateBy(selectedEl.id, -45)} title="Rotate -45"><ChevronLeft className="w-3.5 h-3.5" /></SbBtn>
          <input type="range" min={0} max={359} value={selectedEl.rotation}
            onChange={(e) => rotateTo(selectedEl.id, +e.target.value)}
            className="w-16 h-1 accent-indigo-500 rounded-full" />
          <SbBtn onClick={() => rotateBy(selectedEl.id, 45)} title="Rotate +45"><ChevronRight className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={() => rotateBy(selectedEl.id, 90)} title="Rotate +90"><RotateCw className="w-3.5 h-3.5" /></SbBtn>
          <span className="text-[10px] font-mono text-slate-600 w-8 text-center tabular-nums">{selectedEl.rotation}&deg;</span>
          <div className="w-px h-4 bg-slate-200/60" />
          <SbBtn onClick={() => flipElement(selectedEl.id, "h")} title="Flip horizontal"><FlipHorizontal className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={() => flipElement(selectedEl.id, "v")} title="Flip vertical"><FlipVertical className="w-3.5 h-3.5" /></SbBtn>
        </div>

        {/* Row 3: Size */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/50 px-2.5 py-1.5 flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Size</span>
          <MoveHorizontal className="w-3 h-3 text-slate-400" />
          <input type="number" value={selectedEl.width} min={16} max={800} step={GRID_SIZE}
            onChange={(e) => setElementSize(selectedEl.id, +e.target.value, selectedEl.height)}
            className="w-14 h-6 text-[10px] text-center font-mono border border-slate-200/80 rounded-lg bg-white focus:border-indigo-400 focus:outline-none transition-colors" />
          <span className="text-[9px] text-slate-300">&times;</span>
          <MoveVertical className="w-3 h-3 text-slate-400" />
          <input type="number" value={selectedEl.height} min={16} max={600} step={GRID_SIZE}
            onChange={(e) => setElementSize(selectedEl.id, selectedEl.width, +e.target.value)}
            className="w-14 h-6 text-[10px] text-center font-mono border border-slate-200/80 rounded-lg bg-white focus:border-indigo-400 focus:outline-none transition-colors" />
          <SbBtn onClick={() => setLockAspect(!lockAspect)} title={lockAspect ? "Unlock aspect" : "Lock aspect"}
            active={lockAspect}>
            {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </SbBtn>
          <div className="w-px h-4 bg-slate-200/60" />
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((f) => (
            <Button key={f} variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-mono text-slate-500 rounded-lg hover:bg-slate-50 transition-all"
              onClick={() => scaleElement(selectedEl.id, f)} title={`Scale ${f * 100}%`}>
              {Math.round(f * 100)}%
            </Button>
          ))}
        </div>

        {/* Row 4: Actions */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/8 border border-slate-200/50 px-2.5 py-1.5 flex items-center gap-1 flex-wrap">
          <SbBtn onClick={undo} disabled={!canUndo} title="Undo"><RotateCcw className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={redo} disabled={!canRedo} title="Redo"><RotateCw className="w-3.5 h-3.5" /></SbBtn>
          <div className="w-px h-4 bg-slate-200/60" />
          <SbBtn onClick={sendBackward} title="Send back"><ArrowDown className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={bringForward} title="Bring forward"><ArrowUp className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={sendToBack} title="Send to back"><ChevronDown className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={bringToFront} title="Bring to front"><ChevronUp className="w-3.5 h-3.5" /></SbBtn>
          <div className="w-px h-4 bg-slate-200/60" />
          <SbBtn onClick={duplicateSelected} title="Duplicate"><Copy className="w-3.5 h-3.5" /></SbBtn>
          <SbBtn onClick={startEditLabel} title="Edit label"><span className="text-xs font-bold">Aa</span></SbBtn>
          <div className="w-px h-4 bg-slate-200/60" />
          <SbBtn onClick={deleteSelected} title="Delete" variant="danger"><Trash2 className="w-3.5 h-3.5" /></SbBtn>
        </div>
      </div>
    </div>
  );
}

function SbBtn({ onClick, disabled, title, children, variant, active }: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
  active?: boolean;
}) {
  return (
    <Button variant="ghost" size="sm"
      className={`h-7 w-7 p-0 rounded-xl transition-all duration-150
        ${variant === "danger"
          ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
          : active
            ? "text-indigo-600 bg-indigo-50"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-90"
        }
        disabled:opacity-30 disabled:pointer-events-none`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}
