import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPortal } from "react-dom";
import {
  Trash2, Copy, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Minus, Plus, X, Tag,
} from "lucide-react";
import { ELEMENT_DEFS } from "../constants";
import type { PlacedElement } from "../types";

interface Props {
  element: PlacedElement | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<PlacedElement>) => void;
  onSetGuests: (id: string, delta: number) => void;
  onRotateBy: (id: string, deg: number) => void;
  onRotateTo: (id: string, deg: number) => void;
  onFlip: (id: string, axis: "h" | "v") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  scale?: number;
}

const TABLE_TYPES = ["round-table", "rect-table", "sweetheart-table", "cake-table"];

export default function ElementEditPopup({
  element, open, onOpenChange,
  onUpdate, onSetGuests, onRotateBy, onRotateTo, onFlip,
  onDuplicate, onDelete,
}: Props) {
  const [localLabel, setLocalLabel] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const def = element ? ELEMENT_DEFS.find((d) => d.type === element.type) : null;
  const isTable = element ? TABLE_TYPES.includes(element.type) : false;
  const guests = element?.guests ?? (element?.type === "round-table" ? 10 : 8);

  useEffect(() => {
    if (element) {
      setLocalLabel(element.label || def?.label || "");
    }
  }, [element?.id, element?.label]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let ready = false;
    const handler = (e: PointerEvent) => {
      if (!ready) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const timer = setTimeout(() => { ready = true; }, 300);
    window.addEventListener("pointerdown", handler);
    return () => { clearTimeout(timer); window.removeEventListener("pointerdown", handler); };
  }, [open, onOpenChange]);

  if (!open || !element || !def) return null;

  const Icon = def.icon;

  const pw = 272;
  let left = 0;
  let top = 0;
  if (typeof window !== "undefined") {
    left = Math.min(element.x * scale + element.width * scale + 16, window.innerWidth - pw - 12);
    if (left < 12) left = Math.max(12, element.x * scale - pw - 16);
    top = Math.max(12, Math.min(element.y * scale + 20, window.innerHeight - 400));
  }

  const commitLabel = () => {
    if (localLabel !== (element.label || def.label)) {
      onUpdate(element.id, { label: localLabel });
    }
  };

  const presetRotations = [0, 45, 90, 135, 180, 225, 270, 315];

  return createPortal(
    <div
      ref={panelRef}
      className="fixed rounded-2xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{
        left, top, width: pw, zIndex: 99999,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px -12px rgba(0,0,0,0.18), 0 8px 24px -8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${def.color}, ${def.color}88)` }} />

      {/* Header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-slate-100/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: def.color + "15" }}>
          <Icon className="w-4 h-4" style={{ color: def.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{def.label}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <PillBtn onClick={onDuplicate} title="Duplicate" className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
            <Copy className="w-3.5 h-3.5" />
          </PillBtn>
          <PillBtn onClick={() => { onDelete(); onOpenChange(false); }} title="Delete" className="text-slate-400 hover:text-red-500 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
          </PillBtn>
          <PillBtn onClick={() => onOpenChange(false)} title="Close" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-3.5 h-3.5" />
          </PillBtn>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Label */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Label
          </label>
          <Input value={localLabel} onChange={(e) => setLocalLabel(e.target.value)} onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === "Enter") commitLabel(); }} placeholder={def.label}
            className="h-8 text-xs rounded-xl border-slate-200/80 focus:border-indigo-400 focus:ring-indigo-400/20 bg-slate-50/50" />
        </div>

        {/* Seats */}
        {isTable && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Seats</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/30">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none hover:bg-slate-100"
                  onClick={() => onSetGuests(element.id, -1)} disabled={guests <= 8}>
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-10 h-8 flex items-center justify-center text-sm font-bold text-slate-800 tabular-nums">{guests}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none hover:bg-slate-100"
                  onClick={() => onSetGuests(element.id, 1)} disabled={guests >= 12}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">seats</span>
              <div className="flex-1" />
              <div className="flex gap-0.5">
                {[8, 10, 12].map((n) => (
                  <Button key={n} variant="ghost" size="sm"
                    className={`h-6 px-2 text-[10px] font-mono rounded-lg transition-all duration-150 ${guests === n ? "bg-indigo-100 text-indigo-700 font-bold" : "text-slate-400 hover:bg-slate-100"}`}
                    onClick={() => {
                      const cur = element.guests ?? (element.type === "round-table" ? 10 : 8);
                      if (n !== cur) onSetGuests(element.id, n - cur);
                    }}>
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rotation */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Rotation</label>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl hover:bg-slate-100" onClick={() => onRotateBy(element.id, -45)} title="-45°">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <input type="range" min={0} max={359} value={element.rotation}
              onChange={(e) => onRotateTo(element.id, +e.target.value)}
              className="flex-1 h-1 accent-indigo-500 rounded-full" />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl hover:bg-slate-100" onClick={() => onRotateBy(element.id, 45)} title="+45°">
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-mono text-slate-500 w-8 text-center tabular-nums">{element.rotation}°</span>
          </div>
          <div className="flex gap-0.5 mt-1.5">
            {presetRotations.map((deg) => (
              <Button key={deg} variant="ghost" size="sm"
                className={`h-6 flex-1 text-[9px] font-mono rounded-lg transition-all duration-150 ${element.rotation === deg ? "bg-indigo-100 text-indigo-700 font-bold" : "text-slate-400 hover:bg-slate-100"}`}
                onClick={() => onRotateTo(element.id, deg)}>
                {deg}
              </Button>
            ))}
          </div>
        </div>

        {/* Flip */}
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-8 flex-1 text-[10px] gap-1.5 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all" onClick={() => onFlip(element.id, "h")}>
            <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
          </Button>
          <Button variant="ghost" size="sm" className="h-8 flex-1 text-[10px] gap-1.5 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all" onClick={() => onFlip(element.id, "v")}>
            <FlipVertical className="w-3.5 h-3.5" /> Flip V
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PillBtn({ onClick, title, children, className }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button variant="ghost" size="sm"
      className={`h-7 w-7 p-0 rounded-xl transition-all duration-150 active:scale-90 ${className || ""}`}
      onClick={onClick} title={title}>
      {children}
    </Button>
  );
}
