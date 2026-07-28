import React, { useRef, useCallback } from "react";
import { getElementSVG } from "../renderers";
import type { PlacedElement } from "../types";
import { ELEMENT_DEFS } from "../constants";
import { Lock } from "lucide-react";
import ElementFloatingToolbar from "./ElementFloatingToolbar";

interface CanvasElementProps {
  el: PlacedElement;
  selected: boolean;
  isPrimary: boolean;
  zIndex: number;
  selectedCount: number;
  onSelect: (id: string, multi?: boolean) => void;
  onDragStart: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  onDoubleClick: (id: string) => void;
  scale: number;
  onResizeStart: (id: string, handle: string, e: React.MouseEvent | React.TouchEvent) => void;
  onRotateBy: (id: string, deg: number) => void;
  onRotateTo: (id: string, deg: number) => void;
  onFlip: (id: string, axis: "h" | "v") => void;
  onScale: (id: string, factor: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onToggleSnap: () => void;
  onToggleGuides: () => void;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  onEditLabel: (id: string) => void;
  labelInput: { id: string; value: string } | null;
  setLabelInput: (v: { id: string; value: string } | null) => void;
  commitLabel: () => void;
  isTable: boolean;
  updateGuests: (id: string, delta: number) => void;
}

const handles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
const handleCursors: Record<string, string> = {
  nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
};
const handlePositions: Record<string, { left: string; top: string; transform: string }> = {
  nw: { left: "-5px", top: "-5px", transform: "translate(-50%,-50%)" },
  ne: { left: "100%", top: "-5px", transform: "translate(-50%,-50%)" },
  sw: { left: "-5px", top: "100%", transform: "translate(-50%,-50%)" },
  se: { left: "100%", top: "100%", transform: "translate(-50%,-50%)" },
  n: { left: "50%", top: "-5px", transform: "translate(-50%,-50%)" },
  s: { left: "50%", top: "100%", transform: "translate(-50%,-50%)" },
  e: { left: "100%", top: "50%", transform: "translate(-50%,-50%)" },
  w: { left: "-5px", top: "50%", transform: "translate(-50%,-50%)" },
};

export default function CanvasElement({
  el, selected, isPrimary, zIndex, selectedCount,
  onSelect, onDragStart, onDoubleClick, scale, onResizeStart,
  onRotateBy, onRotateTo, onFlip, onScale,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onDuplicate, onDelete, onToggleLock, onGroup, onUngroup,
  onToggleSnap, onToggleGuides, snapEnabled, guidesEnabled, onEditLabel,
  labelInput, setLabelInput, commitLabel, isTable, updateGuests,
}: CanvasElementProps) {
  const def = ELEMENT_DEFS.find((d) => d.type === el.type);
  if (!def) return null;

  const isLocked = el.locked ?? false;
  const isGrouped = !!el.groupId;
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(el.id, isMulti);

    if (isLocked) return;

    const now = Date.now();
    const prev = lastTapRef.current;
    const moved = Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y);
    if (now - prev.time < 350 && moved < 8) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      onDoubleClick(el.id);
      return;
    }
    lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

    onDragStart(el.id, e as unknown as React.MouseEvent);
  }, [el.id, isLocked, onSelect, onDragStart, onDoubleClick]);

  return (
    <div
      style={{
        position: "absolute", left: el.x * scale, top: el.y * scale,
        width: el.width * scale, height: el.height * scale,
        transform: `rotate(${el.rotation}deg)`,
        cursor: isLocked ? "not-allowed" : "move",
        transition: "box-shadow 0.2s ease, filter 0.2s ease",
        zIndex: el.zIndex ?? zIndex,
      }}
      className={`select-none group ${selected ? "" : ""} ${isGrouped ? "" : ""}`}
      onPointerDown={handlePointerDown}
    >
      {/* Element shadow layer */}
      <div
        className="absolute inset-0 rounded-lg transition-all duration-200"
        style={{
          boxShadow: selected
            ? "0 0 0 2px #6366f1, 0 0 0 4px rgba(99,102,241,0.2), 0 8px 25px -5px rgba(0,0,0,0.15)"
            : isGrouped
              ? "0 0 0 1.5px rgba(59,130,246,0.5), 0 2px 8px rgba(0,0,0,0.08)"
              : "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
          opacity: isLocked ? 0.5 : 1,
        }}
      />

      {/* Element SVG */}
      <svg width="100%" height="100%" viewBox={`0 0 ${el.width} ${el.height}`}
        style={{ display: "block", overflow: "visible", opacity: isLocked ? 0.5 : 1, position: "relative", zIndex: 1 }} xmlns="http://www.w3.org/2000/svg">
        {getElementSVG(el)}
      </svg>

      {/* Floating toolbar - only on selected */}
      {selected && !isLocked && (
        <ElementFloatingToolbar
          el={el}
          isTable={isTable}
          labelInput={labelInput}
          onRotateBy={onRotateBy}
          onFlip={onFlip}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleLock={onToggleLock}
          onEditLabel={onEditLabel}
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
          setLabelInput={setLabelInput}
          commitLabel={commitLabel}
          updateGuests={updateGuests}
        />
      )}

      {/* Resize handles */}
      {selected && !isLocked && (
        <>
          {handles.map((h) => (
            <div key={h}
              className="absolute w-5 h-5 sm:w-3 sm:h-3 bg-white border-[1.5px] border-indigo-400 rounded-full shadow-sm hover:bg-indigo-100 hover:border-indigo-500 hover:scale-125 transition-all duration-150 z-30"
              style={{ ...handlePositions[h], cursor: handleCursors[h] }}
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeStart(el.id, h, e); }}
              onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; onResizeStart(el.id, h, { clientX: t.clientX, clientY: t.clientY, stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent); }}
            />
          ))}
        </>
      )}

      {/* Rotation badge */}
      {selected && el.rotation !== 0 && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-indigo-200/60 shadow-sm">
            {el.rotation}&deg;
          </span>
        </div>
      )}

      {/* Size badge */}
      {selected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <span className="text-[9px] font-mono text-slate-500 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-slate-200/60 shadow-sm">
            {el.width}&times;{el.height}
          </span>
        </div>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-0 right-0 -translate-y-1 translate-x-1 z-30 pointer-events-none">
          <div className="w-5 h-5 bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      )}

      {/* Group indicator */}
      {isGrouped && (
        <div className="absolute -top-5 -left-3 pointer-events-none z-30">
          <span className="text-[8px] font-bold text-blue-500 bg-blue-50/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-blue-200/60 shadow-sm">group</span>
        </div>
      )}
    </div>
  );
}
