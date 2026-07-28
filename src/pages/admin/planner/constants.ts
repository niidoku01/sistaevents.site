import React from "react";
import {
  Circle, Square, Tent, Flower2, Music, GlassWater, Star,
  Gift, Car, Camera, Zap, Lightbulb, TreePine,
  Volume2, Minus, Droplets, DoorOpen, ClipboardList,
  Users, Box, Heart, Mic, Monitor, PenTool, LayoutTemplate, Cake,
  ShieldCheck, LogOut, Plug, Cable, Flame,
  Sun, Moon, Trees, Waves, Building2, Grid3x3,
} from "lucide-react";
import type { ElementDef, VenueBg } from "./types";

export const GRID_SIZE = 20;
export const CANVAS_W = 1200;
export const CANVAS_H = 800;

export const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;
export const uid = () => crypto.randomUUID().slice(0, 8);

export const CATEGORIES = ["Furniture", "Structures", "Areas", "Service", "Decor", "Safety", "Utility"];

export const GUIDE_COLORS = {
  edge: "#f43f5e",
  center: "#8b5cf6",
  spacing: "#06b6d4",
  wall: "#f59e0b",
  table: "#10b981",
};

export const ELEMENT_DEFS: ElementDef[] = [
  { type: "round-table", label: "Round Table", icon: Circle, category: "Furniture", defaultWidth: 80, defaultHeight: 80, color: "#d97706", defaultGuests: 10 },
  { type: "rect-table", label: "Long Table", icon: Square, category: "Furniture", defaultWidth: 120, defaultHeight: 50, color: "#b45309", defaultGuests: 8 },
  { type: "chair", label: "Chair", icon: Users, category: "Furniture", defaultWidth: 24, defaultHeight: 24, color: "#78716c" },
  { type: "sofa", label: "Sofa", icon: Square, category: "Furniture", defaultWidth: 100, defaultHeight: 36, color: "#92400e" },
  { type: "cake-table", label: "Cake Table", icon: Star, category: "Furniture", defaultWidth: 60, defaultHeight: 60, color: "#f59e0b" },
  { type: "gift-table", label: "Gift Table", icon: Gift, category: "Furniture", defaultWidth: 80, defaultHeight: 50, color: "#ec4899" },
  { type: "registration", label: "Registration", icon: ClipboardList, category: "Furniture", defaultWidth: 100, defaultHeight: 40, color: "#0891b2" },
  { type: "sweetheart-table", label: "Sweetheart Table", icon: Heart, category: "Furniture", defaultWidth: 90, defaultHeight: 50, color: "#e11d48" },
  { type: "seminar-desk", label: "Seminar Desk", icon: Square, category: "Furniture", defaultWidth: 140, defaultHeight: 40, color: "#78716c" },
  { type: "canopy", label: "Canopy / Tent", icon: Tent, category: "Structures", defaultWidth: 200, defaultHeight: 200, color: "#0369a1" },
  { type: "backdrop", label: "Backdrop", icon: Star, category: "Structures", defaultWidth: 160, defaultHeight: 20, color: "#7c3aed" },
  { type: "entrance", label: "Entrance Arch", icon: DoorOpen, category: "Structures", defaultWidth: 100, defaultHeight: 30, color: "#059669" },
  { type: "stage", label: "Stage / Platform", icon: Square, category: "Structures", defaultWidth: 200, defaultHeight: 100, color: "#475569" },
  { type: "wall", label: "Wall / Barrier", icon: Minus, category: "Structures", defaultWidth: 200, defaultHeight: 10, color: "#334155" },
  { type: "arch", label: "Wedding Arch", icon: Heart, category: "Structures", defaultWidth: 100, defaultHeight: 60, color: "#be185d" },
  { type: "bouncy-castle", label: "Bouncy Castle", icon: Box, category: "Structures", defaultWidth: 160, defaultHeight: 140, color: "#2563eb" },
  { type: "dance-floor", label: "Dance Floor", icon: Music, category: "Areas", defaultWidth: 200, defaultHeight: 200, color: "#be185d" },
  { type: "carpet", label: "Carpet / Runner", icon: Square, category: "Areas", defaultWidth: 60, defaultHeight: 300, color: "#9f1239" },
  { type: "path", label: "Aisle / Path", icon: Square, category: "Areas", defaultWidth: 40, defaultHeight: 200, color: "#ca8a04" },
  { type: "parking", label: "Parking Area", icon: Car, category: "Areas", defaultWidth: 200, defaultHeight: 150, color: "#94a3b8" },
  { type: "restroom", label: "Restroom", icon: Droplets, category: "Areas", defaultWidth: 60, defaultHeight: 60, color: "#06b6d4" },
  { type: "greenery", label: "Greenery", icon: TreePine, category: "Areas", defaultWidth: 40, defaultHeight: 40, color: "#16a34a" },
  { type: "petal-aisle", label: "Petal Aisle", icon: Flower2, category: "Areas", defaultWidth: 60, defaultHeight: 200, color: "#fda4af" },
  { type: "bar", label: "Bar Station", icon: GlassWater, category: "Service", defaultWidth: 100, defaultHeight: 40, color: "#1d4ed8" },
  { type: "buffet", label: "Buffet Station", icon: Square, category: "Service", defaultWidth: 140, defaultHeight: 50, color: "#d97706" },
  { type: "dj-booth", label: "DJ Booth", icon: Music, category: "Service", defaultWidth: 80, defaultHeight: 60, color: "#6d28d9" },
  { type: "speaker", label: "Speaker / PA", icon: Volume2, category: "Service", defaultWidth: 40, defaultHeight: 40, color: "#4b5563" },
  { type: "generator", label: "Generator", icon: Zap, category: "Service", defaultWidth: 60, defaultHeight: 40, color: "#eab308" },
  { type: "lighting", label: "Lighting Rig", icon: Lightbulb, category: "Service", defaultWidth: 60, defaultHeight: 60, color: "#f59e0b" },
  { type: "photo-booth", label: "Photo Booth", icon: Camera, category: "Service", defaultWidth: 80, defaultHeight: 80, color: "#a855f7" },
  { type: "podium", label: "Podium", icon: Mic, category: "Service", defaultWidth: 50, defaultHeight: 40, color: "#1e293b" },
  { type: "projector-screen", label: "Projector Screen", icon: Monitor, category: "Service", defaultWidth: 120, defaultHeight: 10, color: "#374151" },
  { type: "dessert-table", label: "Dessert Table", icon: Cake, category: "Service", defaultWidth: 100, defaultHeight: 45, color: "#f472b6" },
  { type: "candy-bar", label: "Candy Bar", icon: Box, category: "Service", defaultWidth: 100, defaultHeight: 40, color: "#e879f9" },
  { type: "flower", label: "Flower / Decor", icon: Flower2, category: "Decor", defaultWidth: 36, defaultHeight: 36, color: "#e11d48" },
  { type: "text", label: "Label / Text", icon: ({ className }) => React.createElement("span", { className: className + " font-bold text-xs" }, "Aa"), category: "Decor", defaultWidth: 80, defaultHeight: 24, color: "#64748b" },
  { type: "card-box", label: "Card Box", icon: Gift, category: "Decor", defaultWidth: 30, defaultHeight: 30, color: "#fbbf24" },
  { type: "candle", label: "Candle", icon: Flame, category: "Decor", defaultWidth: 20, defaultHeight: 20, color: "#f97316" },
  { type: "photo-frame", label: "Photo Frame", icon: Camera, category: "Decor", defaultWidth: 30, defaultHeight: 40, color: "#a78bfa" },
  { type: "neon-sign", label: "Neon Sign", icon: Zap, category: "Decor", defaultWidth: 80, defaultHeight: 30, color: "#f43f5e" },
  { type: "banner-stand", label: "Banner Stand", icon: LayoutTemplate, category: "Decor", defaultWidth: 40, defaultHeight: 80, color: "#0ea5e9" },
  { type: "first-aid", label: "First Aid", icon: ShieldCheck, category: "Safety", defaultWidth: 40, defaultHeight: 40, color: "#dc2626" },
  { type: "fire-exit", label: "Fire Exit", icon: LogOut, category: "Safety", defaultWidth: 40, defaultHeight: 30, color: "#16a34a" },
  { type: "power-strip", label: "Power / Outlet", icon: Plug, category: "Utility", defaultWidth: 30, defaultHeight: 20, color: "#6b7280" },
  { type: "cable-run", label: "Cable Run", icon: Cable, category: "Utility", defaultWidth: 10, defaultHeight: 100, color: "#374151" },
];

export const VENUE_BACKGROUNDS: VenueBg[] = [
  { id: "default", label: "Plain", icon: Grid3x3, group: "Interior", bg: "#f8fafc", gridColor: "#e2e8f0", label3d: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" },
  { id: "ballroom", label: "Ballroom", icon: Building2, group: "Interior", bg: "#faf5ee", bgSize: "40px 40px", gridColor: "#e8dcc8", label3d: "linear-gradient(135deg, #faf5ee, #e8dcc8)" },
  { id: "conference", label: "Conference", icon: Monitor, group: "Interior", bg: "#f8fafc", bgSize: "20px 20px", gridColor: "#e2e8f0", label3d: "linear-gradient(135deg, #f8fafc, #e2e8f0)" },
  { id: "warehouse", label: "Warehouse", icon: Box, group: "Interior", bg: "#e5e7eb", bgSize: "60px 60px", gridColor: "#d1d5db", label3d: "linear-gradient(135deg, #9ca3af, #d1d5db)" },
  { id: "garden", label: "Garden", icon: Trees, group: "Exterior", bg: "#ecfdf5", bgSize: "50px 50px", gridColor: "#a7f3d0", label3d: "linear-gradient(135deg, #86efac, #bbf7d0)" },
  { id: "beach", label: "Beach", icon: Waves, group: "Exterior", bg: "#fefce8", bgSize: "30px 30px", gridColor: "#fde68a", label3d: "linear-gradient(135deg, #fef9c3, #fde68a)" },
  { id: "rooftop", label: "Rooftop", icon: Sun, group: "Exterior", bg: "#f1f5f9", bgSize: "40px 40px", gridColor: "#cbd5e1", label3d: "linear-gradient(135deg, #94a3b8, #cbd5e1)" },
  { id: "night", label: "Night", icon: Moon, group: "Exterior", bg: "#0f172a", gridColor: "#1e293b", label3d: "linear-gradient(135deg, #0f172a, #1e293b)" },
];

export const HEIGHT_MAP: Record<string, number> = {
  "stage": 35, "canopy": 55, "backdrop": 60, "podium": 40, "bouncy-castle": 50,
  "banner-stand": 45, "entrance": 30, "arch": 45, "wall": 25, "dj-booth": 30,
  "speaker": 35, "generator": 25, "lighting": 15, "projector-screen": 40,
  "photo-booth": 35, "candle": 12, "photo-frame": 8, "neon-sign": 10,
  "round-table": 22, "rect-table": 20, "chair": 18, "sofa": 20,
  "cake-table": 24, "gift-table": 20, "registration": 20, "sweetheart-table": 22,
  "seminar-desk": 18, "bar": 22, "buffet": 20, "dessert-table": 22,
  "candy-bar": 20, "card-box": 10, "flower": 6, "greenery": 15,
  "dance-floor": 2, "carpet": 1, "path": 1, "parking": 1,
  "restroom": 18, "first-aid": 14, "fire-exit": 12, "power-strip": 3, "cable-run": 2, "text": 1,
};

export const USAGE_KEY = "event-planner-usage";
