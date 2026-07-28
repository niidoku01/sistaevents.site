import React from "react";
import type { PlacedElement, ElementType, Guide } from "./types";
import { ELEMENT_DEFS, GRID_SIZE, CANVAS_W, CANVAS_H, GUIDE_COLORS, USAGE_KEY, snap } from "./constants";

export const lbl = (x: number, y: number, text: string, size: number, fill = "#374151") => (
  React.createElement("text", {
    x, y, textAnchor: "middle", dominantBaseline: "central",
    fontSize: size, fill, fontWeight: 500, fontFamily: "system-ui, sans-serif",
  }, text)
);

// ─── Usage tracking ────────────────────────────────────────
export function trackUsage(type: ElementType) {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    counts[type] = (counts[type] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(counts));
  } catch {}
}

export function getUsageCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getFrequentTypes(minCount = 2): ElementType[] {
  const counts = getUsageCounts();
  return Object.entries(counts)
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t as ElementType);
}

// ─── Device performance detection ──────────────────────────
export function detectDevicePerf(): "low" | "medium" | "high" {
  try {
    const cores = navigator.hardwareConcurrency || 2;
    const mem = (navigator as Record<string, number | undefined>).deviceMemory || 4;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || cores <= 2 || mem <= 2) return "low";
    if (cores <= 4 || mem <= 4) return "medium";
    return "high";
  } catch { return "medium"; }
}

// ─── Alignment guide system ────────────────────────────────
export function findAlignmentGuides(moving: PlacedElement, others: PlacedElement[], threshold = 6): Guide[] {
  const guides: Guide[] = [];
  const mCx = moving.x + moving.width / 2;
  const mCy = moving.y + moving.height / 2;
  const mRight = moving.x + moving.width;
  const mBottom = moving.y + moving.height;

  // 1. Canvas center lines
  const cCx = CANVAS_W / 2, cCy = CANVAS_H / 2;
  if (Math.abs(mCx - cCx) <= threshold) {
    guides.push({ type: "v", pos: cCx, x1: 0, y1: 0, x2: 0, y2: CANVAS_H, color: GUIDE_COLORS.center, label: "Center", snapX: cCx - moving.width / 2 });
  }
  if (Math.abs(mCy - cCy) <= threshold) {
    guides.push({ type: "h", pos: cCy, x1: 0, y1: 0, x2: CANVAS_W, y2: 0, color: GUIDE_COLORS.center, label: "Center", snapY: cCy - moving.height / 2 });
  }
  if (Math.abs(mCy - CANVAS_H * 0.25) <= threshold) {
    guides.push({ type: "h", pos: CANVAS_H * 0.25, x1: 0, y1: 0, x2: CANVAS_W, y2: 0, color: GUIDE_COLORS.center, label: "25%" });
  }

  // 2. Wall / edge snapping
  const wallSnapDist = 25;
  const wallPairs: { pos: number; axis: "x" | "y"; guide: "v" | "h"; label: string; snapVal: number }[] = [
    { pos: 0, axis: "x", guide: "v", label: "Left wall", snapVal: 0 },
    { pos: CANVAS_W, axis: "x", guide: "v", label: "Right wall", snapVal: CANVAS_W - moving.width },
    { pos: 0, axis: "y", guide: "h", label: "Top wall", snapVal: 0 },
    { pos: CANVAS_H, axis: "y", guide: "h", label: "Bottom wall", snapVal: CANVAS_H - moving.height },
  ];
  for (const w of wallPairs) {
    const elPos = w.axis === "x" ? moving.x : moving.y;
    if (Math.abs(elPos - w.pos) <= wallSnapDist) {
      const ext = w.axis === "x" ? CANVAS_H : CANVAS_W;
      if (w.guide === "v") {
        guides.push({ type: "v", pos: w.pos, x1: w.pos, y1: 0, x2: w.pos, y2: ext, color: GUIDE_COLORS.wall, label: w.label, snapX: w.snapVal });
      } else {
        guides.push({ type: "h", pos: w.pos, x1: 0, y1: w.pos, x2: ext, y2: w.pos, color: GUIDE_COLORS.wall, label: w.label, snapY: w.snapVal });
      }
    }
  }

  // 3. Edge & center alignment with other elements
  for (const el of others) {
    if (el.id === moving.id) continue;
    const eCx = el.x + el.width / 2;
    const eCy = el.y + el.height / 2;
    const eRight = el.x + el.width;
    const eBottom = el.y + el.height;

    const vPairs: { movingVal: number; targetVal: number; label?: string }[] = [
      { movingVal: moving.x, targetVal: el.x, label: "Left" },
      { movingVal: mRight, targetVal: eRight, label: "Right" },
      { movingVal: moving.x, targetVal: eRight, label: "Left\u2192Right" },
      { movingVal: mRight, targetVal: el.x, label: "Right\u2192Left" },
      { movingVal: mCx, targetVal: eCx, label: "Center" },
    ];
    for (const p of vPairs) {
      if (Math.abs(p.movingVal - p.targetVal) <= threshold) {
        const yMin = Math.min(moving.y, el.y) - 15;
        const yMax = Math.max(mBottom, eBottom) + 15;
        guides.push({ type: "v", pos: p.targetVal, x1: Math.min(moving.x, el.x) - 10, y1: yMin, x2: Math.max(mRight, eRight) + 10, y2: yMax, color: GUIDE_COLORS.edge, label: p.label });
      }
    }
    const hPairs: { movingVal: number; targetVal: number; label?: string }[] = [
      { movingVal: moving.y, targetVal: el.y, label: "Top" },
      { movingVal: mBottom, targetVal: eBottom, label: "Bottom" },
      { movingVal: moving.y, targetVal: eBottom, label: "Top\u2192Bottom" },
      { movingVal: mBottom, targetVal: el.y, label: "Bottom\u2192Top" },
      { movingVal: mCy, targetVal: eCy, label: "Center" },
    ];
    for (const p of hPairs) {
      if (Math.abs(p.movingVal - p.targetVal) <= threshold) {
        const xMin = Math.min(moving.x, el.x) - 15;
        const xMax = Math.max(mRight, eRight) + 15;
        guides.push({ type: "h", pos: p.targetVal, x1: xMin, y1: Math.min(moving.y, el.y) - 10, x2: xMax, y2: Math.max(mBottom, eBottom) + 10, color: GUIDE_COLORS.edge, label: p.label });
      }
    }
  }

  // 4. Table row / column grid alignment
  const isTable = ["round-table", "rect-table", "sweetheart-table", "cake-table", "gift-table", "registration"].includes(moving.type);
  const tables = others.filter((e) => ["round-table", "rect-table", "sweetheart-table", "cake-table"].includes(e.type));
  if (isTable && tables.length > 0) {
    const xPositions = tables.map((t) => t.x).sort((a, b) => a - b);
    const yPositions = tables.map((t) => t.y).sort((a, b) => a - b);
    for (const t of tables) {
      if (Math.abs(mCx - (t.x + t.width / 2)) <= threshold) {
        guides.push({ type: "v", pos: t.x + t.width / 2, x1: t.x + t.width / 2 - 0.5, y1: Math.min(moving.y, t.y) - 20, x2: t.x + t.width / 2 + 0.5, y2: Math.max(mBottom, t.y + t.height) + 20, color: GUIDE_COLORS.table, label: "Column" });
      }
      if (Math.abs(mCy - (t.y + t.height / 2)) <= threshold) {
        guides.push({ type: "h", pos: t.y + t.height / 2, x1: Math.min(moving.x, t.x) - 20, y1: t.y + t.height / 2 - 0.5, x2: Math.max(mRight, t.x + t.width) + 20, y2: t.y + t.height / 2 + 0.5, color: GUIDE_COLORS.table, label: "Row" });
      }
    }
    if (xPositions.length >= 2) {
      const gaps = [];
      for (let i = 1; i < xPositions.length; i++) gaps.push(xPositions[i] - xPositions[i - 1]);
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap > 40 && avgGap < 300) {
        for (const xp of xPositions) {
          const targetX = xp + avgGap;
          if (Math.abs(moving.x - targetX) <= threshold) {
            guides.push({ type: "v", pos: targetX + moving.width / 2, x1: targetX, y1: 0, x2: targetX + 0.5, y2: CANVAS_H, color: GUIDE_COLORS.spacing, label: `${Math.round(avgGap)}px gap` });
          }
        }
      }
    }
    if (yPositions.length >= 2) {
      const gaps = [];
      for (let i = 1; i < yPositions.length; i++) gaps.push(yPositions[i] - yPositions[i - 1]);
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap > 40 && avgGap < 300) {
        for (const yp of yPositions) {
          const targetY = yp + avgGap;
          if (Math.abs(moving.y - targetY) <= threshold) {
            guides.push({ type: "h", pos: targetY + moving.height / 2, x1: 0, y1: targetY, x2: CANVAS_W, y2: targetY + 0.5, color: GUIDE_COLORS.spacing, label: `${Math.round(avgGap)}px gap` });
          }
        }
      }
    }
  }

  // 5. Stage/backdrop centering on canvas
  if (["stage", "backdrop", "entrance", "arch", "podium"].includes(moving.type)) {
    if (Math.abs(mCx - cCx) <= threshold) {
      guides.push({ type: "v", pos: cCx, x1: cCx - 0.5, y1: 0, x2: cCx + 0.5, y2: CANVAS_H, color: GUIDE_COLORS.center, label: "Venue center", snapX: cCx - moving.width / 2 });
    }
  }

  // 6. Dance floor / stage proximity hint
  const danceFloors = others.filter((e) => e.type === "dance-floor");
  const stages = others.filter((e) => e.type === "stage");
  for (const df of [...danceFloors, ...stages]) {
    const dfCx = df.x + df.width / 2;
    if (Math.abs(mCy - (df.y - 30)) <= threshold && Math.abs(mCx - dfCx) < df.width) {
      guides.push({ type: "h", pos: df.y - 30, x1: df.x, y1: df.y - 30, x2: df.x + df.width, y2: df.y - 30, color: GUIDE_COLORS.spacing, label: "Stage front" });
    }
  }

  // 7. Chair proximity to round table (circular snap)
  if (moving.type === "chair") {
    const roundTables = others.filter((e) => e.type === "round-table");
    for (const rt of roundTables) {
      const rtCx = rt.x + rt.width / 2, rtCy = rt.y + rt.height / 2;
      const dx = mCx - rtCx, dy = mCy - rtCy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idealDist = rt.width * 0.56;
      if (Math.abs(dist - idealDist) <= threshold + 5) {
        const angle = Math.atan2(dy, dx);
        const snapX = rtCx + Math.cos(angle) * idealDist - moving.width / 2;
        const snapY = rtCy + Math.sin(angle) * idealDist - moving.height / 2;
        guides.push({ type: "v", pos: snapX + moving.width / 2, x1: snapX, y1: snapY, x2: snapX + moving.width, y2: snapY + moving.height, color: GUIDE_COLORS.table, label: "Chair ring", snapX, snapY });
      }
    }
  }

  return guides;
}

// ─── AI Auto-Arrange ──────────────────────────────────────
export function autoArrange(elements: PlacedElement[]): PlacedElement[] {
  if (elements.length === 0) return elements;
  const arranged = elements.map((e) => ({ ...e }));
  const bounds = { w: CANVAS_W, h: CANVAS_H };
  const padding = 20;
  const cx = bounds.w / 2, cy = bounds.h / 2;
  for (let iter = 0; iter < 80; iter++) {
    for (let i = 0; i < arranged.length; i++) {
      let fx = 0, fy = 0;
      for (let j = 0; j < arranged.length; j++) {
        if (i === j) continue;
        const a = arranged[i], b = arranged[j];
        const ax = a.x + a.width / 2, ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2, by = b.y + b.height / 2;
        let dx = ax - bx, dy = ay - by;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        dx /= dist; dy /= dist;
        const minDist = (Math.max(a.width, a.height) + Math.max(b.width, b.height)) / 2 + padding;
        if (dist < minDist) {
          const force = (minDist - dist) * 0.4;
          fx += dx * force; fy += dy * force;
        }
      }
      const a = arranged[i];
      fx += (cx - (a.x + a.width / 2)) * 0.005;
      fy += (cy - (a.y + a.height / 2)) * 0.005;
      arranged[i] = {
        ...a,
        x: snap(Math.max(padding, Math.min(bounds.w - a.width - padding, a.x + fx))),
        y: snap(Math.max(padding, Math.min(bounds.h - a.height - padding, a.y + fy))),
      };
    }
  }
  const tables = arranged.filter((e) => ["round-table", "rect-table", "sweetheart-table", "cake-table"].includes(e.type));
  const nonTables = arranged.filter((e) => !["round-table", "rect-table", "sweetheart-table", "cake-table"].includes(e.type));
  if (tables.length > 0) {
    const tCx = bounds.w * 0.5, tCy = bounds.h * 0.5;
    const rows = Math.ceil(Math.sqrt(tables.length));
    const spacing = 140;
    tables.forEach((t, i) => {
      const row = Math.floor(i / rows), col = i % rows;
      const gx = tCx - ((rows - 1) * spacing) / 2 + col * spacing;
      const gy = tCy - ((Math.ceil(tables.length / rows) - 1) * spacing) / 2 + row * spacing;
      t.x = snap(Math.max(padding, Math.min(bounds.w - t.width - padding, gx - t.width / 2)));
      t.y = snap(Math.max(padding, Math.min(bounds.h - t.height - padding, gy - t.height / 2)));
    });
  }
  const entrances = nonTables.filter((e) => ["entrance", "arch", "backdrop"].includes(e.type));
  const walls = nonTables.filter((e) => e.type === "wall");
  const others = nonTables.filter((e) => !["entrance", "arch", "backdrop", "wall"].includes(e.type));
  entrances.forEach((e, i) => {
    e.x = snap(bounds.w / 2 - e.width / 2 + i * 140);
    e.y = snap(padding);
  });
  walls.forEach((e, i) => {
    e.x = snap(padding + i * (e.width + padding));
    e.y = snap(padding + 60);
    e.rotation = 0;
  });
  others.forEach((e, i) => {
    const angle = (i / others.length) * Math.PI * 2;
    const rx = bounds.w * 0.4, ry = bounds.h * 0.35;
    e.x = snap(Math.max(padding, Math.min(bounds.w - e.width - padding, cx + Math.cos(angle) * rx - e.width / 2)));
    e.y = snap(Math.max(padding, Math.min(bounds.h - e.height - padding, cy + Math.sin(angle) * ry - e.height / 2)));
  });
  return [...entrances, ...walls, ...tables, ...others].map((e, i) => ({ ...e, zIndex: i }));
}

// ─── Total guests calculation ──────────────────────────────
export function calculateTotalGuests(elements: PlacedElement[]): number {
  return elements.reduce((sum, el) => {
    if (el.type === "round-table") return sum + (el.guests ?? 10);
    if (el.type === "rect-table") return sum + (el.guests ?? 8);
    if (el.type === "chair") return sum + 1;
    return sum;
  }, 0);
}
