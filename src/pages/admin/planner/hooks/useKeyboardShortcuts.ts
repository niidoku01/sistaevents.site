import { useEffect, useCallback } from "react";
import type { PlacedElement, ElementType } from "../types";
import { ELEMENT_DEFS, GRID_SIZE } from "../constants";
import { trackUsage } from "../utils";

interface UseKeyboardShortcutsParams {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  elements: PlacedElement[];
  setElements: React.Dispatch<React.SetStateAction<PlacedElement[]>>;
  pushHistory: (next: PlacedElement[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  labelInput: { id: string; value: string } | null;
  setLabelInput: (v: { id: string; value: string } | null) => void;
  rotationInput: boolean;
  setRotationInput: (v: boolean) => void;
  moveLayer: (id: string, dir: number) => void;
  nudgeElement: (id: string, dx: number, dy: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  rotateBy: (id: string, deg: number) => void;
  flipElement: (id: string, axis: "h" | "v") => void;
  uid: () => string;
  onToggleLock: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
}

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams) {
  const {
    selectedId, setSelectedId, elements, setElements, pushHistory,
    undo, redo, canUndo, canRedo,
    labelInput, setLabelInput, rotationInput, setRotationInput,
    moveLayer, nudgeElement, resizeElement, rotateBy, flipElement, uid,
    onToggleLock, onGroup, onUngroup,
  } = params;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (labelInput) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const next = elements.filter((el) => el.id !== selectedId);
          setElements(next);
          pushHistory(next);
          setSelectedId(null);
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setLabelInput(null);
        setRotationInput(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "r" && selectedId) { rotateBy(selectedId, 45); }
      if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey) && selectedId) {
        e.preventDefault();
        const el = elements.find((el) => el.id === selectedId);
        if (el) {
          const dup = { ...el, id: uid(), x: el.x + 20, y: el.y + 20 };
          const next = [...elements, dup];
          setElements(next);
          pushHistory(next);
          setSelectedId(dup.id);
        }
      }
      if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey) && e.shiftKey && selectedId) {
        e.preventDefault();
        flipElement(selectedId, "h");
      }
      if (e.key === "ArrowUp" && selectedId) {
        e.preventDefault();
        if (e.shiftKey) {
          const el = elements.find((x) => x.id === selectedId)!;
          resizeElement(selectedId, el.width, el.height - GRID_SIZE);
        } else if (e.ctrlKey) {
          moveLayer(selectedId, 1);
        } else {
          nudgeElement(selectedId, 0, -1);
        }
      }
      if (e.key === "ArrowDown" && selectedId) {
        e.preventDefault();
        if (e.shiftKey) {
          const el = elements.find((x) => x.id === selectedId)!;
          resizeElement(selectedId, el.width, el.height + GRID_SIZE);
        } else if (e.ctrlKey) {
          moveLayer(selectedId, -1);
        } else {
          nudgeElement(selectedId, 0, 1);
        }
      }
      if (e.key === "ArrowLeft" && selectedId) {
        e.preventDefault();
        if (e.shiftKey) {
          const el = elements.find((x) => x.id === selectedId)!;
          resizeElement(selectedId, el.width - GRID_SIZE, el.height);
        } else {
          nudgeElement(selectedId, -1, 0);
        }
      }
      if (e.key === "ArrowRight" && selectedId) {
        e.preventDefault();
        if (e.shiftKey) {
          const el = elements.find((x) => x.id === selectedId)!;
          resizeElement(selectedId, el.width + GRID_SIZE, el.height);
        } else {
          nudgeElement(selectedId, 1, 0);
        }
      }
      if (e.key === "[" && selectedId) { nudgeElement(selectedId, -GRID_SIZE, 0); }
      if (e.key === "]" && selectedId) { nudgeElement(selectedId, GRID_SIZE, 0); }
      if (e.key === "{" && selectedId) { nudgeElement(selectedId, 0, -GRID_SIZE); }
      if (e.key === "}" && selectedId) { nudgeElement(selectedId, 0, GRID_SIZE); }
      if ((e.ctrlKey || e.metaKey) && e.key === "l" && selectedId) { e.preventDefault(); onToggleLock(selectedId); }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && !e.shiftKey) { e.preventDefault(); onGroup(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "G" && selectedId) { e.preventDefault(); onUngroup(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, elements, pushHistory, labelInput, undo, redo, moveLayer, nudgeElement, resizeElement, rotateBy, flipElement, setSelectedId, setLabelInput, setRotationInput, setElements, uid, onToggleLock, onGroup, onUngroup]);
}
