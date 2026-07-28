import React from "react";
import type { PlacedElement } from "../types";
import { ELEMENT_DEFS } from "../constants";
import { lbl } from "../utils";

// ─── Furniture ─────────────────────────────────────────────
function renderRoundTable(w: number, h: number, label: string, guests: number = 10) {
  const cx = w / 2, cy = h / 2, s = Math.min(w, h);
  const tr = s * 0.33, cd = s * 0.44, cr = s * 0.055;
  const angleStep = 360 / guests;
  return (<g>
    {Array.from({ length: guests }, (_, i) => {
      const a = (i * angleStep - 90) * Math.PI / 180;
      return <circle key={i} cx={cx + Math.cos(a) * cd} cy={cy + Math.sin(a) * cd} r={cr} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.5} />;
    })}
    <circle cx={cx} cy={cy} r={tr} fill="#faf7f0" stroke="#d4c5a9" strokeWidth={1.2} />
    <circle cx={cx} cy={cy} r={tr * 0.52} fill="#f0ebe0" stroke="#c9b896" strokeWidth={0.8} />
    <circle cx={cx} cy={cy} r={2.5} fill="#d4a574" />
    {lbl(cx, cy + 4, `${guests} seats`, Math.max(5, Math.min(7, s * 0.08)), "#9ca3af")}
    {lbl(cx, cy + tr + 8, label, Math.max(6, Math.min(8, s * 0.1)))}
  </g>);
}

function renderRectTable(w: number, h: number, label: string, guests: number = 8) {
  const cx = w / 2, cy = h / 2;
  const tw = w * 0.88, th = h * 0.55;
  const cw2 = Math.min(6, w * 0.05), ch2 = Math.min(5, h * 0.12);
  const topCount = Math.ceil(guests / 2);
  const bottomCount = Math.floor(guests / 2);
  const topGap = tw / (topCount + 1);
  const bottomGap = tw / (bottomCount + 1);
  return (<g>
    {Array.from({ length: topCount }, (_, i) => (
      <rect key={`t${i}`} x={cx - tw / 2 + (i + 1) * topGap - cw2 / 2} y={cy - th / 2 - ch2 - 3} width={cw2} height={ch2} rx={1.5} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.4} />
    ))}
    {Array.from({ length: bottomCount }, (_, i) => (
      <rect key={`b${i}`} x={cx - tw / 2 + (i + 1) * bottomGap - cw2 / 2} y={cy + th / 2 + 3} width={cw2} height={ch2} rx={1.5} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.4} />
    ))}
    <rect x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} rx={3} fill="#faf7f0" stroke="#d4c5a9" strokeWidth={1} />
    <rect x={cx - tw / 2 + 3} y={cy - th / 2 + 2} width={tw - 6} height={th - 4} rx={2} fill="none" stroke="#e8dcc8" strokeWidth={0.5} />
    {lbl(cx, cy - 3, `${guests} seats`, Math.max(5, Math.min(6, w * 0.05)), "#9ca3af")}
    {lbl(cx, cy + 5, label, Math.max(6, Math.min(9, w * 0.07)))}
  </g>);
}

function renderChair(w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={cx - w * 0.35} y={cy - h * 0.15} width={w * 0.7} height={h * 0.65} rx={2} fill="#d1d5db" stroke="#9ca3af" strokeWidth={0.6} />
    <rect x={cx - w * 0.38} y={cy - h * 0.42} width={w * 0.76} height={h * 0.28} rx={1.5} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.5} />
  </g>);
}

function renderSofa(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const arm = w * 0.08, body = w - arm * 2;
  return (<g>
    <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h * 0.25} fill="#b45309" stroke="#92400e" strokeWidth={1} />
    <rect x={cx - w / 2 + arm} y={cy - h * 0.32} width={body} height={h * 0.64} rx={3} fill="#d97706" stroke="#b45309" strokeWidth={0.6} />
    <line x1={cx - body / 6} y1={cy - h * 0.3} x2={cx - body / 6} y2={cy + h * 0.3} stroke="#b45309" strokeWidth={0.6} />
    <line x1={cx + body / 6} y1={cy - h * 0.3} x2={cx + body / 6} y2={cy + h * 0.3} stroke="#b45309" strokeWidth={0.6} />
    {lbl(cx, cy + h / 2 + 7, label, Math.max(6, Math.min(8, w * 0.07)))}
  </g>);
}

function renderCakeTable(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38;
  return (<g>
    <circle cx={cx} cy={cy} r={r} fill="#faf7f0" stroke="#d4c5a9" strokeWidth={1} />
    <circle cx={cx} cy={cy} r={r * 0.6} fill="#fef3c7" stroke="#f59e0b" strokeWidth={0.8} />
    <circle cx={cx} cy={cy} r={r * 0.3} fill="#fffbeb" stroke="#fbbf24" strokeWidth={0.6} />
    <circle cx={cx} cy={cy} r={r * 0.1} fill="#f59e0b" />
    {lbl(cx, cy + r + 7, label, Math.max(6, Math.min(7, w * 0.1)))}
  </g>);
}

function renderGiftTable(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const tw = w * 0.9, th = h * 0.65;
  const gw = Math.min(14, w * 0.16), gh = Math.min(12, h * 0.3);
  return (<g>
    <rect x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} rx={2} fill="#faf7f0" stroke="#d4c5a9" strokeWidth={1} />
    <rect x={cx - gw - 3} y={cy - gh / 2} width={gw} height={gh} rx={1} fill="#ec4899" stroke="#db2777" strokeWidth={0.5} />
    <line x1={cx - gw / 2 - 3} y1={cy - gh / 2} x2={cx - gw / 2 - 3} y2={cy + gh / 2} stroke="#f472b6" strokeWidth={0.8} />
    <line x1={cx - gw - 3} y1={cy} x2={cx - 3} y2={cy} stroke="#f472b6" strokeWidth={0.8} />
    <rect x={cx + 3} y={cy - gh / 2 + 1} width={gw * 0.8} height={gh * 0.8} rx={1} fill="#a855f7" stroke="#9333ea" strokeWidth={0.5} />
    {lbl(cx, cy + th / 2 + 7, label, Math.max(6, Math.min(7, w * 0.08)))}
  </g>);
}

function renderRegistration(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const dw = w * 0.85, dh = h * 0.7;
  return (<g>
    <rect x={cx - dw / 2} y={cy - dh / 2} width={dw} height={dh} rx={3} fill="#ecfeff" stroke="#06b6d4" strokeWidth={1} />
    <rect x={cx - 6} y={cy - dh * 0.3} width={12} height={dh * 0.6} rx={1} fill="white" stroke="#0891b2" strokeWidth={0.6} />
    <rect x={cx - 3} y={cy - dh * 0.35} width={6} height={3} rx={1} fill="#0891b2" />
    <line x1={cx - 4} y1={cy - 2} x2={cx + 4} y2={cy - 2} stroke="#06b6d4" strokeWidth={0.4} />
    <line x1={cx - 4} y1={cy + 1} x2={cx + 4} y2={cy + 1} stroke="#06b6d4" strokeWidth={0.4} />
    {lbl(cx, cy + dh / 2 + 7, label, Math.max(6, Math.min(7, w * 0.07)))}
  </g>);
}

function renderSweetheartTable(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const tw = w * 0.85, th = h * 0.6;
  return (<g>
    <ellipse cx={cx} cy={cy} rx={tw / 2} ry={th / 2} fill="#fff1f2" stroke="#f43f5e" strokeWidth={1} />
    <ellipse cx={cx} cy={cy} rx={tw / 2 - 4} ry={th / 2 - 3} fill="none" stroke="#fda4af" strokeWidth={0.5} />
    <circle cx={cx - 5} cy={cy} r={2} fill="#f43f5e" />
    <circle cx={cx + 5} cy={cy} r={2} fill="#f43f5e" />
    {lbl(cx, cy + 3, label, Math.max(5, Math.min(6, w * 0.06)), "#be185d")}
  </g>);
}

function renderSeminarDesk(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={4} y={2} width={w - 8} height={h - 4} rx={2} fill="#d1d5db" stroke="#9ca3af" strokeWidth={1} />
    <rect x={8} y={4} width={w - 16} height={h - 8} rx={1} fill="#e5e7eb" stroke="#d1d5db" strokeWidth={0.5} />
    {lbl(cx, cy, label, Math.max(5, Math.min(6, w * 0.04)))}
  </g>);
}

// ─── Structures ────────────────────────────────────────────
function renderCanopy(w: number, h: number, label: string) {
  const m = 6;
  return (<g>
    <rect x={m} y={m} width={w - m * 2} height={h - m * 2} fill="#e0f2fe" stroke="#0369a1" strokeWidth={1.5} rx={4} />
    <rect x={m + 6} y={m + 6} width={w - m * 2 - 12} height={h - m * 2 - 12} fill="none" stroke="#0ea5e9" strokeWidth={0.8} strokeDasharray="4 3" rx={2} />
    <line x1={m} y1={m} x2={w - m} y2={h - m} stroke="#7dd3fc" strokeWidth={0.6} />
    <line x1={w - m} y1={m} x2={m} y2={h - m} stroke="#7dd3fc" strokeWidth={0.6} />
    {[[m, m], [w - m, m], [m, h - m], [w - m, h - m]].map(([px, py], i) => (
      <circle key={i} cx={px} cy={py} r={3} fill="#0369a1" stroke="#0284c7" strokeWidth={0.5} />
    ))}
    {lbl(w / 2, h / 2, label, Math.max(8, Math.min(12, Math.min(w, h) * 0.06)))}
  </g>);
}

function renderBackdrop(w: number, h: number, label: string) {
  return (<g>
    <rect x={1} y={1} width={w - 2} height={h - 2} fill="#ede9fe" stroke="#7c3aed" strokeWidth={1} rx={2} />
    {Array.from({ length: Math.floor(w / 6) }, (_, i) => (
      <line key={i} x1={4 + i * 6} y1={3} x2={4 + i * 6} y2={h - 3} stroke="#c4b5fd" strokeWidth={1.2} opacity={0.6 + (i % 2) * 0.3} />
    ))}
    {lbl(w / 2, h / 2, label, Math.max(5, Math.min(7, h * 0.4)), "#5b21b6")}
  </g>);
}

function renderEntrance(w: number, h: number, label: string) {
  const cy = h / 2, pr = Math.min(6, h * 0.28);
  return (<g>
    <rect x={2} y={cy - h * 0.35} width={pr * 2} height={h * 0.7} rx={1.5} fill="#059669" stroke="#047857" strokeWidth={0.8} />
    <rect x={w - pr * 2 - 2} y={cy - h * 0.35} width={pr * 2} height={h * 0.7} rx={1.5} fill="#059669" stroke="#047857" strokeWidth={0.8} />
    <path d={`M ${pr * 2 + 4} ${cy - h * 0.3} Q ${w / 2} ${-h * 0.1} ${w - pr * 2 - 4} ${cy - h * 0.3}`} fill="none" stroke="#10b981" strokeWidth={1.5} />
    {lbl(w / 2, cy + 2, label, Math.max(5, Math.min(7, w * 0.06)))}
  </g>);
}

function renderStage(w: number, h: number, label: string) {
  return (<g>
    <rect x={1} y={1} width={w - 2} height={h - 2} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} rx={3} />
    <rect x={1} y={h * 0.78} width={w - 2} height={h * 0.22} fill="#475569" stroke="#334155" strokeWidth={0.8} rx={2} />
    <line x1={4} y1={h * 0.78} x2={w - 4} y2={h * 0.78} stroke="#94a3b8" strokeWidth={0.5} />
    {lbl(w / 2, h * 0.38, label, Math.max(8, Math.min(12, Math.min(w, h) * 0.08)), "#1e293b")}
  </g>);
}

function renderWall(w: number, h: number) {
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#334155" stroke="#1e293b" strokeWidth={0.8} />
    {Array.from({ length: Math.floor(w / 8) }, (_, i) => (
      <line key={i} x1={i * 8} y1={0} x2={i * 8} y2={h} stroke="#475569" strokeWidth={0.3} />
    ))}
  </g>);
}

function renderArch(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={4} y={h * 0.35} width={8} height={h * 0.65} rx={2} fill="#fda4af" stroke="#f472b6" strokeWidth={0.8} />
    <rect x={w - 12} y={h * 0.35} width={8} height={h * 0.65} rx={2} fill="#fda4af" stroke="#f472b6" strokeWidth={0.8} />
    <path d={`M 8 ${h * 0.35} Q ${cx} ${-h * 0.15} ${w - 8} ${h * 0.35}`} fill="none" stroke="#e11d48" strokeWidth={2.5} />
    <path d={`M 12 ${h * 0.38} Q ${cx} ${-h * 0.05} ${w - 12} ${h * 0.38}`} fill="none" stroke="#fda4af" strokeWidth={1} />
    {Array.from({ length: 5 }, (_, i) => {
      const t = (i + 1) / 6;
      const px = 8 + (w - 16) * t;
      const py = h * 0.35 - Math.sin(t * Math.PI) * h * 0.4;
      return <circle key={i} cx={px} cy={py} r={2} fill="#f472b6" />;
    })}
    {lbl(cx, h * 0.7, label, Math.max(5, Math.min(7, w * 0.06)))}
  </g>);
}

function renderBouncyCastle(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={4} y={h * 0.15} width={w - 8} height={h * 0.75} rx={8} fill="#dbeafe" stroke="#2563eb" strokeWidth={1.5} />
    <rect x={10} y={h * 0.1} width={w - 20} height={h * 0.2} rx={4} fill="#3b82f6" stroke="#2563eb" strokeWidth={0.8} />
    <rect x={cx - 10} y={h * 0.65} width={20} height={h * 0.25} rx={3} fill="#60a5fa" stroke="#2563eb" strokeWidth={0.6} />
    {lbl(cx, cy, label, Math.max(6, Math.min(10, Math.min(w, h) * 0.06)), "#1e40af")}
  </g>);
}

// ─── Areas ─────────────────────────────────────────────────
function renderDanceFloor(w: number, h: number, label: string) {
  const ts = Math.max(8, Math.min(w, h) / 12);
  const cols = Math.ceil(w / ts), rows = Math.ceil(h / ts);
  return (<g>
    {Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (
        <rect key={`${r}-${c}`} x={c * ts} y={r * ts} width={ts} height={ts}
          fill={(r + c) % 2 === 0 ? "#1f2937" : "#d1d5db"} stroke="#374151" strokeWidth={0.3} />
      ))
    )}
    <rect x={0} y={0} width={w} height={h} fill="none" stroke="#be185d" strokeWidth={1.5} rx={2} />
    {lbl(w / 2, h / 2, label, Math.max(8, Math.min(12, Math.min(w, h) * 0.06)), "#fce7f3")}
  </g>);
}

function renderCarpet(w: number, h: number, label: string) {
  const b = 4;
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#9f1239" stroke="#881337" strokeWidth={1} rx={1} />
    <rect x={b} y={b} width={w - b * 2} height={h - b * 2} fill="none" stroke="#fda4af" strokeWidth={0.8} rx={1} />
    {lbl(w / 2, h / 2, label, Math.max(5, Math.min(7, w * 0.12)), "#fce7f3")}
  </g>);
}

function renderPath(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#fef9c3" stroke="#ca8a04" strokeWidth={0.8} strokeDasharray="4 3" rx={2} />
    <line x1={cx} y1={8} x2={cx} y2={h - 8} stroke="#ca8a04" strokeWidth={1} strokeDasharray="6 4" />
    {lbl(cx, h / 2, label, Math.max(5, Math.min(7, w * 0.15)), "#854d0e")}
  </g>);
}

function renderParking(w: number, h: number, label: string) {
  const cw2 = Math.min(24, w * 0.12), ch2 = Math.min(14, h * 0.1);
  const cols = Math.floor((w - 20) / (cw2 + 8));
  const rows = Math.floor((h - 30) / (ch2 + 6));
  const ox = (w - cols * (cw2 + 8)) / 2 + 4, oy = 25;
  return (<g>
    <rect x={1} y={1} width={w - 2} height={h - 2} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1} rx={3} />
    {Array.from({ length: cols + 1 }, (_, i) => (
      <line key={i} x1={ox + i * (cw2 + 8) - 4} y1={oy - 4} x2={ox + i * (cw2 + 8) - 4} y2={oy + rows * (ch2 + 6) + 4} stroke="#cbd5e1" strokeWidth={0.8} />
    ))}
    {lbl(w / 2, 14, label, Math.max(7, Math.min(10, w * 0.05)))}
  </g>);
}

function renderRestroom(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={1} y={1} width={w - 2} height={h - 2} fill="#ecfeff" stroke="#06b6d4" strokeWidth={1.2} rx={2} />
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(12, w * 0.2)} fill="#0891b2" fontWeight={700} fontFamily="system-ui">WC</text>
  </g>);
}

function renderGreenery(w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.42;
  return (<g>
    <circle cx={cx} cy={cy} r={r} fill="#22c55e" stroke="#16a34a" strokeWidth={1} />
    <circle cx={cx - r * 0.25} cy={cy - r * 0.2} r={r * 0.4} fill="#4ade80" opacity={0.6} />
    <circle cx={cx + r * 0.2} cy={cy + r * 0.25} r={r * 0.35} fill="#86efac" opacity={0.5} />
  </g>);
}

function renderPetalAisle(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#fff1f2" stroke="#fda4af" strokeWidth={0.8} rx={2} />
    {Array.from({ length: Math.floor(h / 20) }, (_, i) => {
      const py = 10 + i * 20;
      return <g key={i}>
        <circle cx={cx - 8} cy={py} r={2.5} fill="#fda4af" opacity={0.7} />
        <circle cx={cx + 8} cy={py + 8} r={2} fill="#f472b6" opacity={0.5} />
        <circle cx={cx} cy={py + 4} r={1.5} fill="#fda4af" opacity={0.4} />
      </g>;
    })}
    {lbl(cx, h / 2, label, Math.max(4, Math.min(6, w * 0.12)), "#be185d")}
  </g>);
}

// ─── Service ───────────────────────────────────────────────
function renderBar(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const cw2 = w * 0.85, ch2 = h * 0.5;
  return (<g>
    <rect x={cx - cw2 / 2} y={cy - ch2 / 2} width={cw2} height={ch2} rx={3} fill="#1d4ed8" stroke="#1e40af" strokeWidth={1} />
    <rect x={cx - cw2 / 2 + 2} y={cy - ch2 / 2 + 2} width={cw2 - 4} height={ch2 * 0.4} rx={2} fill="#3b82f6" opacity={0.5} />
    {lbl(cx, cy + ch2 / 2 + 8, label, Math.max(5, Math.min(7, w * 0.06)))}
  </g>);
}

function renderBuffet(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const cw2 = w * 0.9, ch2 = h * 0.45;
  const tr = Math.min(6, Math.min(w, h) * 0.08);
  const tc = Math.max(3, Math.floor(cw2 / (tr * 3)));
  return (<g>
    <rect x={cx - cw2 / 2} y={cy - ch2 / 2} width={cw2} height={ch2} rx={3} fill="#fef3c7" stroke="#d97706" strokeWidth={1} />
    {Array.from({ length: tc }, (_, i) => (
      <ellipse key={i} cx={cx - cw2 / 2 + tr + 4 + i * ((cw2 - 8) / tc)} cy={cy} rx={tr} ry={tr * 0.7} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.5} />
    ))}
    {lbl(cx, cy + ch2 / 2 + 8, label, Math.max(6, Math.min(8, w * 0.055)))}
  </g>);
}

function renderDjBooth(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} fill="#4c1d95" stroke="#6d28d9" strokeWidth={1.2} rx={3} />
    <rect x={w * 0.15} y={h * 0.25} width={w * 0.7} height={h * 0.35} rx={2} fill="#7c3aed" stroke="#6d28d9" strokeWidth={0.6} />
    <circle cx={w * 0.33} cy={h * 0.42} r={Math.min(8, w * 0.09)} fill="#1e1b4b" stroke="#a78bfa" strokeWidth={0.5} />
    <circle cx={w * 0.33} cy={h * 0.42} r={2} fill="#a78bfa" />
    <circle cx={w * 0.67} cy={h * 0.42} r={Math.min(8, w * 0.09)} fill="#1e1b4b" stroke="#a78bfa" strokeWidth={0.5} />
    <circle cx={w * 0.67} cy={h * 0.42} r={2} fill="#a78bfa" />
    {lbl(cx, h * 0.78, label, Math.max(5, Math.min(7, w * 0.07)), "#e9d5ff")}
  </g>);
}

function renderSpeaker(w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.18;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} fill="#374151" stroke="#1f2937" strokeWidth={1} rx={3} />
    <circle cx={cx} cy={cy - r * 0.6} r={r} fill="#1f2937" stroke="#6b7280" strokeWidth={0.6} />
    <circle cx={cx} cy={cy + r * 0.8} r={r * 0.65} fill="#1f2937" stroke="#6b7280" strokeWidth={0.5} />
  </g>);
}

function renderGenerator(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} fill="#fef9c3" stroke="#eab308" strokeWidth={1.2} rx={3} />
    <polygon points={`${cx + 2},${h * 0.25} ${cx - 4},${h * 0.5} ${cx + 1},${h * 0.5} ${cx - 2},${h * 0.75} ${cx + 5},${h * 0.45} ${cx},${h * 0.45}`} fill="#eab308" stroke="#ca8a04" strokeWidth={0.4} />
    {lbl(cx, h - 8, label, Math.max(5, Math.min(6, w * 0.09)))}
  </g>);
}

function renderLighting(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.2;
  return (<g>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45) * Math.PI / 180;
      const lr = Math.min(w, h) * 0.45;
      return <line key={i} x1={cx + Math.cos(a) * r} y1={cy + Math.sin(a) * r} x2={cx + Math.cos(a) * lr} y2={cy + Math.sin(a) * lr} stroke="#fbbf24" strokeWidth={1.5} opacity={0.4} />;
    })}
    <circle cx={cx} cy={cy} r={r} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1} />
    <circle cx={cx} cy={cy} r={r * 0.4} fill="#fef3c7" />
    {lbl(cx, h - 8, label, Math.max(5, Math.min(6, w * 0.09)))}
  </g>);
}

function renderPhotoBooth(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={3} fill="#f3e8ff" stroke="#a855f7" strokeWidth={1} />
    <rect x={cx - 7} y={cy - 5} width={14} height={10} rx={2} fill="#7c3aed" stroke="#6d28d9" strokeWidth={0.6} />
    <circle cx={cx} cy={cy} r={3} fill="#c4b5fd" stroke="#7c3aed" strokeWidth={0.4} />
    {lbl(cx, cy + h / 2 - 8, label, Math.max(5, Math.min(7, w * 0.07)))}
  </g>);
}

function renderPodium(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <polygon points={`${cx - w * 0.3},${h * 0.8} ${cx + w * 0.3},${h * 0.8} ${cx + w * 0.2},${h * 0.3} ${cx - w * 0.2},${h * 0.3}`} fill="#334155" stroke="#1e293b" strokeWidth={1} />
    <rect x={cx - w * 0.18} y={h * 0.15} width={w * 0.36} height={h * 0.18} rx={2} fill="#475569" stroke="#64748b" strokeWidth={0.6} />
    {lbl(cx, cy + 2, label, Math.max(5, Math.min(7, w * 0.1)), "#e2e8f0")}
  </g>);
}

function renderProjectorScreen(w: number, h: number, label: string) {
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#1e293b" stroke="#334155" strokeWidth={0.8} rx={1} />
    <rect x={w * 0.02} y={1} width={w * 0.96} height={h - 2} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={0.3} />
    {lbl(w / 2, h / 2, label, Math.max(4, Math.min(6, w * 0.04)))}
  </g>);
}

function renderDessertTable(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={4} y={h * 0.3} width={w - 8} height={h * 0.4} rx={3} fill="#fdf2f8" stroke="#f472b6" strokeWidth={0.8} />
    <circle cx={cx - 12} cy={h * 0.25} r={5} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.4} />
    <circle cx={cx} cy={h * 0.2} r={7} fill="#fb7185" stroke="#f43f5e" strokeWidth={0.4} />
    <circle cx={cx + 12} cy={h * 0.25} r={4} fill="#c084fc" stroke="#a855f7" strokeWidth={0.4} />
    {lbl(cx, cy + 3, label, Math.max(5, Math.min(6, w * 0.05)))}
  </g>);
}

function renderCandyBar(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  const colors = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
  return (<g>
    <rect x={4} y={h * 0.25} width={w - 8} height={h * 0.5} rx={3} fill="#fdf4ff" stroke="#d946ef" strokeWidth={0.8} />
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={8 + i * ((w - 16) / 6)} y={h * 0.3} width={(w - 20) / 6} height={h * 0.35} rx={1.5} fill={colors[i]} opacity={0.7} />
    ))}
    {lbl(cx, cy + 2, label, Math.max(5, Math.min(6, w * 0.05)))}
  </g>);
}

// ─── Decor ─────────────────────────────────────────────────
function renderFlower(w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.32;
  return (<g>
    {Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60) * Math.PI / 180;
      return <ellipse key={i} cx={cx + Math.cos(a) * r * 0.5} cy={cy + Math.sin(a) * r * 0.5} rx={r * 0.5} ry={r * 0.3} fill="#fda4af" stroke="#f472b6" strokeWidth={0.4} transform={`rotate(${i * 60} ${cx + Math.cos(a) * r * 0.5} ${cy + Math.sin(a) * r * 0.5})`} />;
    })}
    <circle cx={cx} cy={cy} r={r * 0.28} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.5} />
  </g>);
}

function renderText(w: number, h: number, label: string) {
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="white" fillOpacity={0.85} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 2" rx={2} />
    {lbl(w / 2, h / 2, label, Math.max(8, Math.min(12, h * 0.5)))}
  </g>);
}

function renderCardBox(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={2} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} />
    <rect x={cx - 5} y={3} width={10} height={3} rx={1} fill="#f59e0b" />
    <line x1={cx} y1={6} x2={cx} y2={h - 4} stroke="#fbbf24" strokeWidth={0.5} strokeDasharray="2 1.5" />
  </g>);
}

function renderCandle(w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={cx - 2} y={cy - h * 0.15} width={4} height={h * 0.55} rx={1} fill="#fef3c7" stroke="#fbbf24" strokeWidth={0.5} />
    <ellipse cx={cx} cy={cy - h * 0.2} rx={3} ry={h * 0.12} fill="#f97316" opacity={0.8} />
    <ellipse cx={cx} cy={cy - h * 0.25} rx={1.5} ry={h * 0.06} fill="#fbbf24" />
    <rect x={cx - 4} y={cy + h * 0.4} width={8} height={h * 0.15} rx={1} fill="#d4a574" stroke="#b45309" strokeWidth={0.4} />
  </g>);
}

function renderPhotoFrame(w: number, h: number) {
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={2} fill="#ede9fe" stroke="#a78bfa" strokeWidth={1.2} />
    <rect x={5} y={5} width={w - 10} height={h - 10} rx={1} fill="#f5f3ff" stroke="#c4b5fd" strokeWidth={0.5} />
    <line x1={5} y1={5} x2={w - 5} y2={h - 5} stroke="#ddd6fe" strokeWidth={0.3} />
    <line x1={w - 5} y1={5} x2={5} y2={h - 5} stroke="#ddd6fe" strokeWidth={0.3} />
  </g>);
}

function renderNeonSign(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={3} fill="#1e1b4b" stroke="#312e81" strokeWidth={1} />
    <rect x={4} y={4} width={w - 8} height={h - 8} rx={2} fill="none" stroke="#f43f5e" strokeWidth={1.5} opacity={0.6} />
    {lbl(cx, cy, label, Math.max(6, Math.min(10, w * 0.08)), "#f43f5e")}
    {lbl(cx, cy + 1, label, Math.max(6, Math.min(10, w * 0.08)), "#fb7185")}
  </g>);
}

function renderBannerStand(w: number, h: number, label: string) {
  const cx = w / 2;
  return (<g>
    <rect x={cx - 3} y={2} width={6} height={h - 4} rx={1} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
    <rect x={4} y={4} width={w - 8} height={h * 0.6} rx={2} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={0.8} />
    {lbl(cx, 4 + h * 0.3, label, Math.max(4, Math.min(6, w * 0.12)), "#0369a1")}
    <rect x={cx - 10} y={h - 4} width={20} height={3} rx={1} fill="#64748b" />
  </g>);
}

// ─── Safety ────────────────────────────────────────────────
function renderFirstAid(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.35;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={3} fill="#fef2f2" stroke="#dc2626" strokeWidth={1} />
    <rect x={cx - s / 6} y={cy - s / 2} width={s / 3} height={s} fill="#dc2626" />
    <rect x={cx - s / 2} y={cy - s / 6} width={s} height={s / 3} fill="#dc2626" />
  </g>);
}

function renderFireExit(w: number, h: number, label: string) {
  const cx = w / 2, cy = h / 2;
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={2} fill="#166534" stroke="#15803d" strokeWidth={1} />
    <path d={`M ${cx - 4} ${cy + 2} L ${cx - 4} ${cy - 4} L ${cx + 2} ${cy - 4}`} fill="none" stroke="white" strokeWidth={1.5} />
    <circle cx={cx + 5} cy={cy - 1} r={3} fill="none" stroke="white" strokeWidth={1} />
    {lbl(cx, h - 8, "EXIT", Math.max(5, Math.min(7, w * 0.15)), "#86efac")}
  </g>);
}

// ─── Utility ───────────────────────────────────────────────
function renderPowerStrip(w: number, h: number) {
  return (<g>
    <rect x={2} y={2} width={w - 4} height={h - 4} rx={3} fill="#e5e7eb" stroke="#6b7280" strokeWidth={0.8} />
    {Array.from({ length: 3 }, (_, i) => (
      <rect key={i} x={5 + i * 7} y={h * 0.25} width={5} height={h * 0.5} rx={1} fill="#374151" />
    ))}
  </g>);
}

function renderCableRun(w: number, h: number) {
  return (<g>
    <rect x={0} y={0} width={w} height={h} fill="#374151" stroke="#1f2937" strokeWidth={0.5} rx={2} />
    <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 3" />
  </g>);
}

// ─── SVG Dispatcher ────────────────────────────────────────
export function getElementSVG(el: PlacedElement): React.ReactNode {
  const def = ELEMENT_DEFS.find((d) => d.type === el.type);
  const w = el.width, h = el.height;
  const label = el.label || def?.label || "";
  switch (el.type) {
    case "round-table": return renderRoundTable(w, h, label, el.guests ?? 10);
    case "rect-table": return renderRectTable(w, h, label, el.guests ?? 8);
    case "chair": return renderChair(w, h);
    case "sofa": return renderSofa(w, h, label);
    case "cake-table": return renderCakeTable(w, h, label);
    case "gift-table": return renderGiftTable(w, h, label);
    case "registration": return renderRegistration(w, h, label);
    case "sweetheart-table": return renderSweetheartTable(w, h, label);
    case "seminar-desk": return renderSeminarDesk(w, h, label);
    case "canopy": return renderCanopy(w, h, label);
    case "backdrop": return renderBackdrop(w, h, label);
    case "entrance": return renderEntrance(w, h, label);
    case "stage": return renderStage(w, h, label);
    case "wall": return renderWall(w, h);
    case "arch": return renderArch(w, h, label);
    case "bouncy-castle": return renderBouncyCastle(w, h, label);
    case "dance-floor": return renderDanceFloor(w, h, label);
    case "carpet": return renderCarpet(w, h, label);
    case "path": return renderPath(w, h, label);
    case "parking": return renderParking(w, h, label);
    case "restroom": return renderRestroom(w, h, label);
    case "greenery": return renderGreenery(w, h);
    case "petal-aisle": return renderPetalAisle(w, h, label);
    case "bar": return renderBar(w, h, label);
    case "buffet": return renderBuffet(w, h, label);
    case "dj-booth": return renderDjBooth(w, h, label);
    case "speaker": return renderSpeaker(w, h);
    case "generator": return renderGenerator(w, h, label);
    case "lighting": return renderLighting(w, h, label);
    case "photo-booth": return renderPhotoBooth(w, h, label);
    case "podium": return renderPodium(w, h, label);
    case "projector-screen": return renderProjectorScreen(w, h, label);
    case "dessert-table": return renderDessertTable(w, h, label);
    case "candy-bar": return renderCandyBar(w, h, label);
    case "flower": return renderFlower(w, h);
    case "text": return renderText(w, h, label);
    case "card-box": return renderCardBox(w, h, label);
    case "candle": return renderCandle(w, h);
    case "photo-frame": return renderPhotoFrame(w, h);
    case "neon-sign": return renderNeonSign(w, h, label);
    case "banner-stand": return renderBannerStand(w, h, label);
    case "first-aid": return renderFirstAid(w, h, label);
    case "fire-exit": return renderFireExit(w, h, label);
    case "power-strip": return renderPowerStrip(w, h);
    case "cable-run": return renderCableRun(w, h);
    default: return <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="#94a3b8">?</text>;
  }
}
