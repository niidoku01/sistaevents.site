import { useState, useCallback, useEffect, useRef, RefObject } from "react";
import type { PlacedElement, ElementType } from "../types";
import { ELEMENT_DEFS, snap, GRID_SIZE } from "../constants";
import { trackUsage, findAlignmentGuides } from "../utils";
import type { Guide } from "../types";

export function usePlannerDrag(params: {
  elements: PlacedElement[];
  setElements: React.Dispatch<React.SetStateAction<PlacedElement[]>>;
  pushHistory: (next: PlacedElement[]) => void;
  setSelectedId: (id: string | null) => void;
  scale: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  uid: () => string;
}) {
  const { elements, setElements, pushHistory, setSelectedId, scale, canvasRef, uid } = params;

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragFromPalette, setDragFromPalette] = useState<ElementType | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const groupOffsetsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const handlePaletteDragStart = useCallback((type: ElementType) => {
    setDragFromPalette(type);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dragFromPalette || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const def = ELEMENT_DEFS.find((d) => d.type === dragFromPalette);
    if (!def) return;
    const x = snap((e.clientX - rect.left) / scale - def.defaultWidth / 2);
    const y = snap((e.clientY - rect.top) / scale - def.defaultHeight / 2);
    const newEl: PlacedElement = { id: uid(), type: dragFromPalette, x, y, width: def.defaultWidth, height: def.defaultHeight, rotation: 0, color: def.color, guests: def.defaultGuests };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
    setSelectedId(newEl.id);
    setDragFromPalette(null);
    trackUsage(dragFromPalette);
  }, [dragFromPalette, elements, pushHistory, scale, canvasRef, setSelectedId, uid]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragStart = useCallback((id: string, e: React.MouseEvent | React.TouchEvent) => {
    const el = elements.find((el) => el.id === id);
    if (!el || el.locked) return;
    setDragging(id);
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    setDragOffset({ x: clientX / scale - el.x, y: clientY / scale - el.y });

    // Compute group offsets for grouped elements
    const groupOffsets = new Map<string, { x: number; y: number }>();
    if (el.groupId) {
      const siblings = elements.filter((s) => s.groupId === el.groupId && s.id !== id && !s.locked);
      for (const s of siblings) {
        groupOffsets.set(s.id, { x: s.x - el.x, y: s.y - el.y });
      }
    }
    groupOffsetsRef.current = groupOffsets;

    trackUsage(el.type);
  }, [elements, scale]);

  useEffect(() => {
    if (!dragging) return;
    const getPos = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) {
        const t = e.touches[0] || e.changedTouches[0];
        return { x: t.clientX, y: t.clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      const newX = snap(pos.x / scale - dragOffset.x);
      const newY = snap(pos.y / scale - dragOffset.y);
      const moving = elements.find((el) => el.id === dragging);
      if (moving) {
        const moved = { ...moving, x: newX, y: newY };
        const newGuides = findAlignmentGuides(moved, elements);
        setGuides(newGuides);
        let finalX = newX, finalY = newY;
        for (const g of newGuides) {
          if (g.snapX !== undefined) finalX = g.snapX;
          if (g.snapY !== undefined) finalY = g.snapY;
          if (g.snapX === undefined && g.type === "v") { const diff = g.pos - (moved.x + moved.width / 2); if (Math.abs(diff) <= 6) finalX = newX + diff; }
          if (g.snapY === undefined && g.type === "h") { const diff = g.pos - (moved.y + moved.height / 2); if (Math.abs(diff) <= 6) finalY = newY + diff; }
        }
        const snappedX = snap(finalX);
        const snappedY = snap(finalY);
        const dx = snappedX - moving.x;
        const dy = snappedY - moving.y;

        setElements((prev) => prev.map((el) => {
          if (el.id === dragging) return { ...el, x: snappedX, y: snappedY };
          if (moving.groupId && el.groupId === moving.groupId && el.id !== dragging && !el.locked) {
            const off = groupOffsetsRef.current.get(el.id);
            if (off) return { ...el, x: snap(moving.x + dx + off.x), y: snap(moving.y + dy + off.y) };
          }
          return el;
        }));
      }
    };
    const onUp = () => {
      setElements((prev) => { pushHistory(prev); return prev; });
      setDragging(null);
      setGuides([]);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, [dragging, dragOffset, scale, pushHistory, elements, setElements]);

  return {
    dragging,
    dragFromPalette,
    guides,
    handlePaletteDragStart,
    handleCanvasDrop,
    handleCanvasDragOver,
    handleDragStart,
  };
}
