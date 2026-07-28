import { useState, useCallback, useEffect } from "react";
import type { PlacedElement } from "../types";
import { snap, GRID_SIZE } from "../constants";

export function usePlannerResize(params: {
  elements: PlacedElement[];
  setElements: React.Dispatch<React.SetStateAction<PlacedElement[]>>;
  pushHistory: (next: PlacedElement[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  scale: number;
}) {
  const { elements, setElements, pushHistory, selectedId, setSelectedId, scale } = params;

  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number; ex: number; ey: number } | null>(null);
  const [lockAspect, setLockAspect] = useState(true);

  const handleResizeStart = useCallback((id: string, handle: string, e: React.MouseEvent | React.TouchEvent) => {
    const el = elements.find((el) => el.id === id);
    if (!el || el.locked) return;
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    setResizeHandle(handle);
    setResizeStart({ x: clientX, y: clientY, w: el.width, h: el.height, ex: el.x, ey: el.y });
    setSelectedId(id);
  }, [elements, setSelectedId]);

  useEffect(() => {
    if (!resizeHandle || !resizeStart || !selectedId) return;
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
      const dx = (pos.x - resizeStart.x) / scale;
      const dy = (pos.y - resizeStart.y) / scale;
      let newW = resizeStart.w, newH = resizeStart.h;
      let newX = resizeStart.ex, newY = resizeStart.ey;
      if (resizeHandle.includes("e")) newW = resizeStart.w + dx;
      if (resizeHandle.includes("w")) { newW = resizeStart.w - dx; newX = resizeStart.ex + dx; }
      if (resizeHandle.includes("s")) newH = resizeStart.h + dy;
      if (resizeHandle.includes("n")) { newH = resizeStart.h - dy; newY = resizeStart.ey + dy; }
      if (resizeHandle === "nw" || resizeHandle === "ne" || resizeHandle === "sw" || resizeHandle === "se") {
        const avgDelta = (dx + dy) / 2;
        if (resizeHandle.includes("e") || resizeHandle.includes("w")) {
          if (resizeHandle.includes("w")) { newW = resizeStart.w - avgDelta; newX = resizeStart.ex + avgDelta; }
          else newW = resizeStart.w + avgDelta;
        }
        if (resizeHandle.includes("n") || resizeHandle.includes("s")) {
          if (resizeHandle.includes("n")) { newH = resizeStart.h - avgDelta; newY = resizeStart.ey + avgDelta; }
          else newH = resizeStart.h + avgDelta;
        }
      }
      newW = Math.max(16, snap(newW));
      newH = Math.max(16, snap(newH));
      newX = snap(newX);
      newY = snap(newY);
      if (lockAspect) {
        const el = elements.find((e) => e.id === selectedId);
        if (el) {
          const aspect = el.width / el.height;
          if (newW / newH > aspect) newW = Math.round(newH * aspect);
          else newH = Math.round(newW / aspect);
        }
      }
      setElements((prev) => {
        const groupEl = prev.find((e) => e.id === selectedId);
        return prev.map((el) => {
          if (el.id === selectedId) return { ...el, width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) };
          // Group resize: apply same delta proportionally
          if (groupEl?.groupId && el.groupId === groupEl.groupId && el.id !== selectedId && !el.locked) {
            const scaleX = newW / (groupEl.width || 1);
            const scaleY = newH / (groupEl.height || 1);
            return { ...el, width: Math.max(16, Math.round(el.width * scaleX)), height: Math.max(16, Math.round(el.height * scaleY)) };
          }
          return el;
        });
      });
    };
    const onUp = () => {
      setElements((prev) => { pushHistory(prev); return prev; });
      setResizeHandle(null);
      setResizeStart(null);
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
  }, [resizeHandle, resizeStart, selectedId, scale, lockAspect, elements, pushHistory, setElements]);

  const resizeElement = useCallback((id: string, newW: number, newH: number, keepAspect = lockAspect) => {
    const el = elements.find((e) => e.id === id);
    if (!el || el.locked) return;
    const minW = 16, minH = 16, maxW = 800, maxH = 600;
    let w = Math.max(minW, Math.min(maxW, snap(newW)));
    let h = Math.max(minH, Math.min(maxH, snap(newH)));
    if (keepAspect) {
      const aspect = el.width / el.height;
      if (w / h > aspect) w = Math.round(h * aspect);
      else h = Math.round(w / aspect);
    }
    const next = elements.map((e) => e.id === id ? { ...e, width: w, height: h } : e);
    setElements(next);
    pushHistory(next);
  }, [elements, lockAspect, setElements, pushHistory]);

  const scaleElement = useCallback((id: string, factor: number) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    resizeElement(id, el.width * factor, el.height * factor, false);
  }, [elements, resizeElement]);

  const setElementSize = useCallback((id: string, w: number, h: number) => {
    const next = elements.map((e) => e.id === id ? { ...e, width: Math.max(16, w), height: Math.max(16, h) } : e);
    setElements(next);
    pushHistory(next);
  }, [elements, setElements, pushHistory]);

  return {
    resizeHandle,
    lockAspect,
    setLockAspect,
    handleResizeStart,
    resizeElement,
    scaleElement,
    setElementSize,
  };
}
