import React from "react";
import { Button } from "@/components/ui/button";
import { CAMERA_PRESETS } from "../cameraPresets";
import { useStudioStore } from "../stores/uiStore";
import {
  Orbit, Eye, Compass, ArrowUp, Map, Plane, MonitorSmartphone, Paintbrush,
  Grid3x3, Sun, SunDim, Moon, Lightbulb, Volume2,
} from "lucide-react";

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

export default function CameraToolbar() {
  const {
    activePreset, setActivePreset,
    lightingPreset, setLightingPreset,
    showShadows, toggleShadows,
    showGrid3D, toggleGrid3D,
    floorMaterial, setFloorMaterial,
    envIntensity, setEnvIntensity,
  } = useStudioStore();

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
      {/* Camera presets */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/10">
        <p className="text-[8px] text-white/50 uppercase font-bold px-1 mb-1 tracking-wider">Camera</p>
        <div className="flex flex-col gap-0.5">
          {CAMERA_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id] || Eye;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all ${
                  activePreset === preset.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
                title={preset.description}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xl:inline">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lighting presets */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/10">
        <p className="text-[8px] text-white/50 uppercase font-bold px-1 mb-1 tracking-wider">Lighting</p>
        <div className="flex flex-col gap-0.5">
          {(["setup", "event", "romantic"] as const).map((mode) => {
            const Icon = LIGHTING_ICONS[mode];
            return (
              <button
                key={mode}
                onClick={() => setLightingPreset(mode)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] capitalize transition-all ${
                  lightingPreset === mode
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xl:inline">{mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/10">
        <button
          onClick={toggleShadows}
          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all ${
            showShadows ? "text-amber-300" : "text-white/40"
          }`}
          title="Toggle shadows"
        >
          <SunDim className="w-3 h-3" />
          <span className="hidden xl:inline">Shadows</span>
        </button>
        <button
          onClick={toggleGrid3D}
          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all ${
            showGrid3D ? "text-cyan-300" : "text-white/40"
          }`}
          title="Toggle 3D grid"
        >
          <Grid3x3 className="w-3 h-3" />
          <span className="hidden xl:inline">Grid</span>
        </button>
      </div>

      {/* Floor material */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white/10">
        <p className="text-[8px] text-white/50 uppercase font-bold px-1 mb-1 tracking-wider">Floor</p>
        <select
          value={floorMaterial}
          onChange={(e) => setFloorMaterial(e.target.value)}
          className="w-full bg-white/10 text-white text-[10px] rounded px-1.5 py-0.5 border border-white/20 focus:outline-none focus:border-amber-400"
        >
          <option value="marble">Marble</option>
          <option value="wood">Oak Wood</option>
          <option value="concrete">Concrete</option>
          <option value="dark">Dark Marble</option>
          <option value="ceramic">Ceramic</option>
        </select>
        <div className="mt-1">
          <input
            type="range" min={0} max={2} step={0.1} value={envIntensity}
            onChange={(e) => setEnvIntensity(+e.target.value)}
            className="w-full h-1 accent-amber-500"
            title={`Reflections: ${envIntensity}`}
          />
        </div>
      </div>
    </div>
  );
}
