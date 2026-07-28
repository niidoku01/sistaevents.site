import { useState, useCallback } from "react";
import type { PlacedElement } from "../types";

export function usePlannerHistory(initialElements: PlacedElement[] = []) {
  const [elements, setElements] = useState<PlacedElement[]>(initialElements);
  const [history, setHistory] = useState<PlacedElement[][]>([initialElements]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const pushHistory = useCallback((next: PlacedElement[]) => {
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), next]);
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setElements(history[historyIdx - 1]);
    }
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setElements(history[historyIdx + 1]);
    }
  }, [historyIdx, history]);

  return {
    elements,
    setElements,
    history,
    historyIdx,
    pushHistory,
    undo,
    redo,
    canUndo: historyIdx > 0,
    canRedo: historyIdx < history.length - 1,
  };
}
