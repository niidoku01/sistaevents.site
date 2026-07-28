import { create } from "zustand";

export type CameraMode = "orbit" | "walkthrough";

export interface StudioUIState {
  cameraMode: CameraMode;
  activePreset: string;
  showShadows: boolean;
  showReflections: boolean;
  lightingPreset: "setup" | "event" | "romantic";
  floorMaterial: string;
  envIntensity: number;
  showGrid3D: boolean;
  walkthroughSpeed: number;

  setCameraMode: (m: CameraMode) => void;
  setActivePreset: (id: string) => void;
  toggleShadows: () => void;
  toggleReflections: () => void;
  setLightingPreset: (p: "setup" | "event" | "romantic") => void;
  setFloorMaterial: (m: string) => void;
  setEnvIntensity: (v: number) => void;
  toggleGrid3D: () => void;
  setWalkthroughSpeed: (v: number) => void;
}

export const useStudioStore = create<StudioUIState>((set) => ({
  cameraMode: "orbit",
  activePreset: "perspective",
  showShadows: true,
  showReflections: true,
  lightingPreset: "event",
  floorMaterial: "marble",
  envIntensity: 0.8,
  showGrid3D: false,
  walkthroughSpeed: 5,

  setCameraMode: (m) => set({ cameraMode: m }),
  setActivePreset: (id) => set({ activePreset: id }),
  toggleShadows: () => set((s) => ({ showShadows: !s.showShadows })),
  toggleReflections: () => set((s) => ({ showReflections: !s.showReflections })),
  setLightingPreset: (p) => set({ lightingPreset: p }),
  setFloorMaterial: (m) => set({ floorMaterial: m }),
  setEnvIntensity: (v) => set({ envIntensity: v }),
  toggleGrid3D: () => set((s) => ({ showGrid3D: !s.showGrid3D })),
  setWalkthroughSpeed: (v) => set({ walkthroughSpeed: v }),
}));
