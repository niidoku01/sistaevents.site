import React, { Suspense, lazy, useRef, useCallback, useEffect, useState } from "react";
import {
  X, Download, Sun, Moon, Lightbulb,
  Compass, ArrowUp, Eye, Map, Plane, MonitorSmartphone,
  Volume2, Paintbrush, Users, Layers, ChevronLeft,
} from "lucide-react";
import { CAMERA_PRESETS } from "../../studio/cameraPresets";
import { useStudioStore } from "../../studio/stores/uiStore";
import { ELEMENT_DEFS } from "../constants";
import type { PlacedElement } from "../types";

const Venue3DView = lazy(() => import("../../studio/viewport/Venue3D"));

const PRESET_ICONS: Record<string, React.FC<{ className?: string }>> = {
  isometric: Compass,
  birdsEye: ArrowUp,
  perspective: Eye,
  walkthrough: Map,
  drone: Plane,
  guestSeat: MonitorSmartphone,
  stageView: Volume2,
  decoratorView: Paintbrush,
};

const LIGHTING_ICONS = {
  setup: Sun,
  event: Lightbulb,
  romantic: Moon,
};

const FLOOR_OPTIONS = [
  { id: "marble", label: "Marble" },
  { id: "wood", label: "Oak Wood" },
  { id: "concrete", label: "Concrete" },
  { id: "dark", label: "Dark Marble" },
  { id: "ceramic", label: "Ceramic" },
];

interface Venue3DFullscreenProps {
  elements: PlacedElement[];
  eventName: string;
  totalGuests: number;
  onClose: () => void;
}

export default function Venue3DFullscreen({ elements, eventName, totalGuests, onClose }: Venue3DFullscreenProps) {
  const screenshotRef = useRef<(() => string) | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  const {
    activePreset, setActivePreset,
    lightingPreset, setLightingPreset,
    showShadows, toggleShadows,
    showGrid3D, toggleGrid3D,
    floorMaterial, setFloorMaterial,
    envIntensity, setEnvIntensity,
  } = useStudioStore();

  const preset = CAMERA_PRESETS.find((p) => p.id === activePreset) || CAMERA_PRESETS[0];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleScreenshot = useCallback(() => {
    if (!screenshotRef.current) return;
    const dataUrl = screenshotRef.current();
    const link = document.createElement("a");
    link.download = `${eventName.replace(/\s+/g, "-").toLowerCase()}-3d-preview.png`;
    link.href = dataUrl;
    link.click();
  }, [eventName]);

  return (
    <div className="fixed inset-0 z-[99998] bg-black">
      {/* 3D Canvas - full viewport */}
      <div className="absolute inset-0">
        <Suspense fallback={
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <span className="text-sm text-white/50 font-medium tracking-wide">Loading 3D venue...</span>
          </div>
        }>
          <Venue3DView
            elements={elements}
            showStudioControls={false}
            onScreenshotReady={(fn) => { screenshotRef.current = fn; }}
          />
        </Suspense>
      </div>

      {/* Top bar - event info + actions */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white/90 tracking-wide">{eventName}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-white/50 bg-black/40 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/5">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{elements.length} elements</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />~{totalGuests} guests</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/10 transition-all duration-200 active:scale-95"
            title="Download 3D preview"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-red-500/80 backdrop-blur-md text-white rounded-xl border border-white/10 transition-all duration-200 active:scale-95"
            title="Close preview (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right panel - controls */}
      <div className={`absolute top-14 right-3 z-20 transition-all duration-300 ${showPanel ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+12px)] opacity-0 pointer-events-none"}`}>
        <div className="w-52 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto">
          {/* Camera presets */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-2">Camera View</p>
            <div className="grid grid-cols-2 gap-1">
              {CAMERA_PRESETS.map((cp) => {
                const Icon = PRESET_ICONS[cp.id] || Eye;
                return (
                  <button key={cp.id} onClick={() => setActivePreset(cp.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-all duration-150 ${
                      activePreset === cp.id
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}>
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{cp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lighting presets */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-2">Lighting Mood</p>
            <div className="flex gap-1">
              {(["setup", "event", "romantic"] as const).map((mode) => {
                const Icon = LIGHTING_ICONS[mode];
                return (
                  <button key={mode} onClick={() => setLightingPreset(mode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] capitalize transition-all duration-150 ${
                      lightingPreset === mode
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}>
                    <Icon className="w-3 h-3" />
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floor material */}
          <div className="p-3 border-b border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-2">Floor Material</p>
            <select value={floorMaterial} onChange={(e) => setFloorMaterial(e.target.value)}
              className="w-full bg-white/10 text-white text-[10px] rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400">
              {FLOOR_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          {/* Toggles + reflection */}
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/50">Shadows</span>
              <button onClick={toggleShadows}
                className={`w-8 h-4 rounded-full transition-all duration-200 ${showShadows ? "bg-amber-500" : "bg-white/20"}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${showShadows ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/50">Grid</span>
              <button onClick={toggleGrid3D}
                className={`w-8 h-4 rounded-full transition-all duration-200 ${showGrid3D ? "bg-cyan-500" : "bg-white/20"}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${showGrid3D ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/50">Reflections</span>
                <span className="text-[9px] text-white/30 font-mono">{envIntensity}</span>
              </div>
              <input type="range" min={0} max={2} step={0.1} value={envIntensity}
                onChange={(e) => setEnvIntensity(+e.target.value)}
                className="w-full h-1 accent-amber-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle panel button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`absolute top-14 z-20 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-md text-white/60 hover:text-white rounded-lg border border-white/10 transition-all duration-300 pointer-events-auto ${showPanel ? "right-[220px]" : "right-3"}`}
        title={showPanel ? "Hide controls" : "Show controls"}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${showPanel ? "rotate-0" : "rotate-180"}`} />
      </button>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
          <span className="text-[10px] text-white/40">Drag to orbit &bull; Scroll to zoom &bull; Right-click to pan</span>
        </div>
      </div>
    </div>
  );
}
