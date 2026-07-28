import React, { RefObject, useState, useCallback, useEffect, useRef } from "react";
import { Upload, LayoutGrid } from "lucide-react";
import { ELEMENT_DEFS, GRID_SIZE } from "../constants";
import CanvasElement from "./CanvasElement";
import type { PlacedElement, ElementType, Guide } from "../types";

interface LassoRect {
  x1: number; y1: number; x2: number; y2: number;
}

interface PlannerCanvasProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  elements: PlacedElement[];
  sortedElements: PlacedElement[];
  selectedIds: string[];
  selectedEl: PlacedElement | undefined;
  selectedDef: { label: string } | undefined;
  isTable: boolean;
  scale: number;
  guides: Guide[];
  dragFromPalette: ElementType | null;
  snapEnabled: boolean;
  guidesEnabled: boolean;
  setSelectedIds: (ids: string[]) => void;
  handleDragStart: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
  handleResizeStart: (id: string, handle: string, e: React.MouseEvent | React.TouchEvent) => void;
  onElementDoubleClick: (id: string) => void;
  handleCanvasClick: (e: React.MouseEvent) => void;
  handleCanvasDrop: (e: React.DragEvent) => void;
  handleCanvasDragOver: (e: React.DragEvent) => void;
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
  onToggleLock: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onToggleSnap: () => void;
  onToggleGuides: () => void;
  setScale: (fn: (s: number) => number) => void;
}

export default function PlannerCanvas({
  canvasRef, showGrid, elements, sortedElements,
  selectedIds, selectedEl, selectedDef, isTable,
  scale, guides, dragFromPalette, snapEnabled, guidesEnabled,
  setSelectedIds, handleDragStart, handleResizeStart, onElementDoubleClick,
  handleCanvasClick, handleCanvasDrop, handleCanvasDragOver,
  labelInput, setLabelInput, commitLabel,
  rotateBy, rotateTo, flipElement,
  setElementSize, scaleElement, lockAspect, setLockAspect,
  undo, redo, canUndo, canRedo,
  sendBackward, bringForward, sendToBack, bringToFront,
  duplicateSelected, startEditLabel, deleteSelected, updateGuests,
  onToggleLock, onGroup, onUngroup, onToggleSnap, onToggleGuides, setScale,
}: PlannerCanvasProps) {
  const [lasso, setLasso] = useState<LassoRect | null>(null);
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    if (e.button !== 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left + canvasRef.current!.scrollLeft) / scale;
    const y = (e.clientY - rect.top + canvasRef.current!.scrollTop) / scale;
    lassoStartRef.current = { x, y };
    setLasso({ x1: x, y1: y, x2: x, y2: y });
  }, [canvasRef, scale]);

  useEffect(() => {
    if (!lassoStartRef.current) return;
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current || !lassoStartRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left + canvasRef.current.scrollLeft) / scale;
      const y = (e.clientY - rect.top + canvasRef.current.scrollTop) / scale;
      setLasso({ x1: lassoStartRef.current.x, y1: lassoStartRef.current.y, x2: x, y2: y });
    };
    const onUp = () => {
      if (lasso) {
        const minX = Math.min(lasso.x1, lasso.x2);
        const maxX = Math.max(lasso.x1, lasso.x2);
        const minY = Math.min(lasso.y1, lasso.y2);
        const maxY = Math.max(lasso.y1, lasso.y2);
        if (maxX - minX > 5 || maxY - minY > 5) {
          const hitIds = elements
            .filter((el) => {
              const ex = el.x, ey = el.y, ew = el.width, eh = el.height;
              return ex < maxX && ex + ew > minX && ey < maxY && ey + eh > minY;
            })
            .map((el) => el.id);
          if (hitIds.length > 0) setSelectedIds(hitIds);
        }
      }
      setLasso(null);
      lassoStartRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [lasso, scale, canvasRef, elements, setSelectedIds]);

  const lassoRect = lasso ? {
    left: Math.min(lasso.x1, lasso.x2) * scale,
    top: Math.min(lasso.y1, lasso.y2) * scale,
    width: Math.abs(lasso.x2 - lasso.x1) * scale,
    height: Math.abs(lasso.y2 - lasso.y1) * scale,
  } : null;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const getDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartRef.current = { dist: getDist(e.touches), scale };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const dist = getDist(e.touches);
        const ratio = dist / pinchStartRef.current.dist;
        const newScale = Math.max(0.2, Math.min(4, pinchStartRef.current.scale * ratio));
        setScale(() => newScale);
      }
    };
    const onTouchEnd = () => { pinchStartRef.current = null; };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [canvasRef, scale, setScale]);

  return (
    <div
      className="flex-1 min-h-0 min-w-0 overflow-auto rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-slate-100/50 relative transition-all duration-300"
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Guide lines */}
      {guides.map((g, i) => (
        <React.Fragment key={i}>
          <div className="absolute pointer-events-none z-25" style={{
            left: g.type === "v" ? g.pos * scale - 0.5 : g.x1 * scale,
            top: g.type === "h" ? g.pos * scale - 0.5 : g.y1 * scale,
            width: g.type === "v" ? 1 : (g.x2 - g.x1) * scale,
            height: g.type === "h" ? 1 : (g.y2 - g.y1) * scale,
            backgroundColor: g.color || "#f43f5e",
            opacity: 0.6,
          }} />
          {g.label && (
            <div className="absolute pointer-events-none z-26 whitespace-nowrap" style={{
              left: g.type === "v" ? g.pos * scale + 3 : g.x1 * scale,
              top: g.type === "h" ? g.pos * scale - 16 : g.y1 * scale,
              fontSize: 9, fontWeight: 600, color: g.color || "#f43f5e",
              textShadow: "0 1px 3px rgba(255,255,255,0.95)",
            }}>{g.label}</div>
          )}
        </React.Fragment>
      ))}

      {/* Lasso selection */}
      {lassoRect && lassoRect.width > 0 && lassoRect.height > 0 && (
        <div
          className="absolute pointer-events-none z-40 rounded-lg"
          style={{
            left: lassoRect.left, top: lassoRect.top,
            width: lassoRect.width, height: lassoRect.height,
            border: "1.5px dashed #6366f1",
            backgroundColor: "rgba(99,102,241,0.06)",
          }}
        />
      )}

      <div ref={canvasRef} className="relative min-w-full sm:min-w-[min(100%,1200px)] min-h-full sm:min-h-[min(100%,800px)]"
        style={{
          backgroundImage: showGrid
            ? `radial-gradient(circle, #d4d8e0 0.8px, transparent 0.8px)`
            : "none",
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundColor: "#f9fafb",
        }}
        onClick={handleCanvasClick} onDrop={handleCanvasDrop} onDragOver={handleCanvasDragOver}>

        {/* Empty state */}
        {elements.length === 0 && !dragFromPalette && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center mb-4">
              <LayoutGrid className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="text-sm text-slate-500 font-semibold mb-1">Start planning your event</p>
            <p className="text-xs text-slate-400">Drag elements from the sidebar onto the canvas</p>
            <p className="text-[10px] text-slate-300 mt-2 bg-slate-100/80 px-3 py-1 rounded-full">{ELEMENT_DEFS.length} elements available</p>
          </div>
        )}

        {/* Elements */}
        {sortedElements.map((el) => (
          <CanvasElement key={el.id} el={el} selected={selectedIds.includes(el.id)}
            isPrimary={selectedIds[0] === el.id}
            selectedCount={selectedIds.length}
            zIndex={sortedElements.indexOf(el)}
            labelInput={labelInput} setLabelInput={setLabelInput} commitLabel={commitLabel}
            isTable={el.type === "round-table" || el.type === "rect-table" || el.type === "sweetheart-table" || el.type === "cake-table"}
            updateGuests={updateGuests}
            onSelect={(id, multi) => {
              if (multi) {
                setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
              } else {
                setSelectedIds([id]);
              }
            }}
            onDragStart={handleDragStart} onDoubleClick={onElementDoubleClick} onResizeStart={handleResizeStart} scale={scale}
            onRotateBy={rotateBy} onRotateTo={rotateTo} onFlip={flipElement} onScale={scaleElement}
            onBringForward={bringForward} onSendBackward={sendBackward}
            onBringToFront={bringToFront} onSendToBack={sendToBack}
            onDuplicate={duplicateSelected} onDelete={deleteSelected}
            onToggleLock={onToggleLock} onGroup={onGroup} onUngroup={onUngroup}
            onToggleSnap={onToggleSnap} onToggleGuides={onToggleGuides}
            snapEnabled={snapEnabled} guidesEnabled={guidesEnabled}
            onEditLabel={(id) => {
              const el = elements.find((e) => e.id === id);
              if (!el) return;
              const def = ELEMENT_DEFS.find((d) => d.type === el.type);
              setLabelInput({ id, value: el.label || def?.label || "" });
            }}
          />
        ))}
      </div>
    </div>
  );
}
