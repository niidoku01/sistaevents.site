import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Copy, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  ArrowUp, ArrowDown, ChevronUp, ChevronDown, Minus, Plus,
  MoveHorizontal, MoveVertical, Lock, Unlock, Users,
} from "lucide-react";
import { ELEMENT_DEFS, GRID_SIZE } from "../constants";
import type { PlacedElement } from "../types";

interface PropertiesPanelProps {
  selectedEl: PlacedElement | undefined;
  selectedDef: { label: string; category: string; color: string } | undefined;
  isTable: boolean;
  onUpdate: (id: string, updates: Partial<PlacedElement>) => void;
  onSetGuests: (id: string, delta: number) => void;
  onRotateBy: (id: string, deg: number) => void;
  onRotateTo: (id: string, deg: number) => void;
  onFlip: (id: string, axis: "h" | "v") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const TABLE_TYPES = ["round-table", "rect-table", "sweetheart-table", "cake-table"];

export default function PropertiesPanel({
  selectedEl, selectedDef, isTable,
  onUpdate, onSetGuests, onRotateBy, onRotateTo, onFlip,
  onDuplicate, onDelete,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
}: PropertiesPanelProps) {
  const [localLabel, setLocalLabel] = useState("");
  const [localX, setLocalX] = useState(0);
  const [localY, setLocalY] = useState(0);
  const [localW, setLocalW] = useState(0);
  const [localH, setLocalH] = useState(0);

  const def = selectedEl ? ELEMENT_DEFS.find((d) => d.type === selectedEl.type) : null;
  const isTableEl = selectedEl ? TABLE_TYPES.includes(selectedEl.type) : false;
  const guests = selectedEl?.guests ?? (selectedEl?.type === "round-table" ? 10 : 8);

  useEffect(() => {
    if (selectedEl) {
      setLocalLabel(selectedEl.label || def?.label || "");
      setLocalX(selectedEl.x);
      setLocalY(selectedEl.y);
      setLocalW(selectedEl.width);
      setLocalH(selectedEl.height);
    }
  }, [selectedEl, def]);

  if (!selectedEl || !selectedDef) {
    return (
      <div className="w-64 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center flex-shrink-0 hidden lg:flex">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 flex items-center justify-center mb-3">
          <MoveHorizontal className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-xs text-slate-500 font-medium">Select an element</p>
        <p className="text-[10px] text-slate-400 mt-1">to edit its properties</p>
      </div>
    );
  }

  const Icon = def!.icon;

  const commitLabel = () => {
    if (localLabel !== (selectedEl.label || def!.label)) {
      onUpdate(selectedEl.id, { label: localLabel });
    }
  };

  const commitPosition = () => {
    const updates: Partial<PlacedElement> = {};
    if (localX !== selectedEl.x) updates.x = localX;
    if (localY !== selectedEl.y) updates.y = localY;
    if (Object.keys(updates).length > 0) onUpdate(selectedEl.id, updates);
  };

  const commitSize = () => {
    const w = Math.max(16, localW);
    const h = Math.max(16, localH);
    if (w !== selectedEl.width || h !== selectedEl.height) {
      onUpdate(selectedEl.id, { width: w, height: h });
    }
  };

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl flex-shrink-0 overflow-y-auto hidden lg:flex flex-col"
      style={{ maxHeight: "calc(100vh - 180px)" }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100/80 flex items-center gap-3 sticky top-0 bg-white/90 backdrop-blur-xl z-10 rounded-t-2xl">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: def!.color + "12" }}>
          <Icon className="w-4 h-4" style={{ color: def!.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{selectedDef.label}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">{selectedDef.category}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 flex-1">
        {/* Label */}
        <SectionLabel>Label</SectionLabel>
        <Input
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => { if (e.key === "Enter") commitLabel(); }}
          placeholder={def!.label}
          className="h-8 text-xs rounded-xl border-slate-200/80 focus:border-indigo-400 focus:ring-indigo-400/20 bg-slate-50/50"
        />

        {/* Seats */}
        {isTableEl && (
          <>
            <SectionLabel><Users className="w-3 h-3" /> Seats</SectionLabel>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/30">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none hover:bg-slate-100"
                  onClick={() => onSetGuests(selectedEl.id, -1)} disabled={guests <= 8}>
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <div className="w-12 h-8 flex items-center justify-center">
                  <span className="text-base font-bold text-slate-800 tabular-nums">{guests}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none hover:bg-slate-100"
                  onClick={() => onSetGuests(selectedEl.id, 1)} disabled={guests >= 12}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex gap-1">
                {[8, 10, 12].map((n) => (
                  <Button key={n} variant="ghost" size="sm"
                    className={`h-6 px-2 text-[10px] font-mono rounded-lg transition-all ${guests === n ? "bg-indigo-100 text-indigo-700 font-bold" : "text-slate-500 border border-slate-200/80 hover:bg-slate-50"}`}
                    onClick={() => {
                      const current = selectedEl.guests ?? (selectedEl.type === "round-table" ? 10 : 8);
                      const delta = n - current;
                      if (delta !== 0) onSetGuests(selectedEl.id, delta);
                    }}>
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Position */}
        <>
          <SectionLabel><MoveHorizontal className="w-3 h-3" /> Position</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-slate-400 font-mono w-3 font-bold">X</span>
              <Input type="number" value={localX} step={GRID_SIZE}
                onChange={(e) => setLocalX(+e.target.value)}
                onBlur={commitPosition}
                className="h-7 text-[10px] font-mono text-center rounded-lg border-slate-200/80 focus:border-indigo-400" />
            </div>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-slate-400 font-mono w-3 font-bold">Y</span>
              <Input type="number" value={localY} step={GRID_SIZE}
                onChange={(e) => setLocalY(+e.target.value)}
                onBlur={commitPosition}
                className="h-7 text-[10px] font-mono text-center rounded-lg border-slate-200/80 focus:border-indigo-400" />
            </div>
          </div>
        </>

        {/* Size */}
        <>
          <SectionLabel><MoveVertical className="w-3 h-3" /> Size</SectionLabel>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-slate-400 font-mono w-3 font-bold">W</span>
              <Input type="number" value={localW} min={16} max={800} step={GRID_SIZE}
                onChange={(e) => setLocalW(+e.target.value)}
                onBlur={commitSize}
                className="h-7 text-[10px] font-mono text-center rounded-lg border-slate-200/80 focus:border-indigo-400" />
            </div>
            <span className="text-[10px] text-slate-300">&times;</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-[10px] text-slate-400 font-mono w-3 font-bold">H</span>
              <Input type="number" value={localH} min={16} max={600} step={GRID_SIZE}
                onChange={(e) => setLocalH(+e.target.value)}
                onBlur={commitSize}
                className="h-7 text-[10px] font-mono text-center rounded-lg border-slate-200/80 focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex gap-1 mt-1.5">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((f) => (
              <Button key={f} variant="ghost" size="sm"
                className="h-6 px-1.5 text-[9px] font-mono text-slate-500 border border-slate-200/80 rounded-lg hover:bg-slate-50 transition-all"
                onClick={() => onUpdate(selectedEl.id, { width: Math.round(selectedEl.width * f), height: Math.round(selectedEl.height * f) })}>
                {Math.round(f * 100)}%
              </Button>
            ))}
          </div>
        </>

        {/* Rotation */}
        <>
          <SectionLabel>Rotation</SectionLabel>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl hover:bg-slate-100" onClick={() => onRotateBy(selectedEl.id, -90)}><RotateCcw className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-mono rounded-lg" onClick={() => onRotateBy(selectedEl.id, -45)}>-45</Button>
            <div className="flex-1 relative">
              <input type="range" min={0} max={359} value={selectedEl.rotation}
                onChange={(e) => onRotateTo(selectedEl.id, +e.target.value)}
                className="w-full h-1 accent-indigo-500 rounded-full" />
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-mono rounded-lg" onClick={() => onRotateBy(selectedEl.id, 45)}>+45</Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl hover:bg-slate-100" onClick={() => onRotateBy(selectedEl.id, 90)}><RotateCw className="w-3.5 h-3.5" /></Button>
            <span className="text-[10px] font-mono text-slate-600 w-8 text-center tabular-nums">{selectedEl.rotation}&deg;</span>
          </div>
          <div className="flex gap-1 mt-1.5">
            <Button variant="ghost" size="sm" className="h-7 flex-1 text-[10px] gap-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all" onClick={() => onFlip(selectedEl.id, "h")}>
              <FlipHorizontal className="w-3 h-3" /> Flip H
            </Button>
            <Button variant="ghost" size="sm" className="h-7 flex-1 text-[10px] gap-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all" onClick={() => onFlip(selectedEl.id, "v")}>
              <FlipVertical className="w-3 h-3" /> Flip V
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <Button key={deg} variant="ghost" size="sm"
                className={`h-6 text-[9px] font-mono rounded-lg transition-all ${selectedEl.rotation === deg ? "bg-indigo-100 text-indigo-700 font-bold" : "text-slate-500 border border-slate-200/80 hover:bg-slate-50"}`}
                onClick={() => onRotateTo(selectedEl.id, deg)}>
                {deg}&deg;
              </Button>
            ))}
          </div>
        </>

        {/* Layer */}
        <>
          <SectionLabel>Layer Order</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            <Btn onClick={onSendToBack}><ChevronDown className="w-3 h-3" /> Back</Btn>
            <Btn onClick={onBringToFront}><ChevronUp className="w-3 h-3" /> Front</Btn>
            <Btn onClick={onSendBackward}><ArrowDown className="w-3 h-3" /> Down</Btn>
            <Btn onClick={onBringForward}><ArrowUp className="w-3 h-3" /> Up</Btn>
          </div>
        </>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      {children}
    </label>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-all" onClick={onClick}>
      {children}
    </Button>
  );
}
