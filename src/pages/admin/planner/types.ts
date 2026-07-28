import type React from "react";

export type ElementType =
  | "round-table" | "rect-table" | "chair" | "sofa"
  | "cake-table" | "gift-table" | "registration"
  | "canopy" | "backdrop" | "entrance" | "stage" | "wall"
  | "dance-floor" | "carpet" | "path" | "parking" | "restroom" | "greenery"
  | "bar" | "buffet" | "dj-booth" | "speaker" | "generator" | "lighting" | "photo-booth"
  | "flower" | "text"
  | "arch" | "sweetheart-table" | "petal-aisle" | "card-box" | "candle" | "photo-frame"
  | "podium" | "projector-screen" | "seminar-desk" | "banner-stand"
  | "dessert-table" | "neon-sign" | "candy-bar" | "bouncy-castle"
  | "first-aid" | "fire-exit" | "power-strip" | "cable-run";

export interface PlacedElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  color?: string;
  guests?: number;
  zIndex?: number;
  locked?: boolean;
  groupId?: string;
}

export interface ElementDef {
  type: ElementType;
  label: string;
  icon: React.FC<{ className?: string }>;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
  defaultGuests?: number;
}

export interface Guide {
  type: "h" | "v";
  pos: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: string;
  snapX?: number;
  snapY?: number;
}

export interface VenueBg {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  group: "Interior" | "Exterior";
  bg: string;
  bgSize?: string;
  gridColor: string;
  label3d: string;
}

export interface PlannerHistory {
  push: (next: PlacedElement[]) => void;
  undo: () => void;
  redo: () => void;
  historyIdx: number;
  historyLength: number;
}
