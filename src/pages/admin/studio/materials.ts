import * as THREE from "three";

export interface MaterialPreset {
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  opacity?: number;
  transparent?: boolean;
  envMapIntensity?: number;
  normalScale?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  "marble-white":   { name: "Marble (White)",    color: "#f5f0e8", metalness: 0.1, roughness: 0.15, envMapIntensity: 1.2 },
  "marble-dark":    { name: "Marble (Dark)",     color: "#2d2d2d", metalness: 0.1, roughness: 0.2,  envMapIntensity: 1.0 },
  "marble-veined":  { name: "Marble (Veined)",   color: "#e8e0d4", metalness: 0.05,roughness: 0.18, envMapIntensity: 1.1 },
  "wood-oak":       { name: "Wood (Oak)",        color: "#b8860b", metalness: 0.0, roughness: 0.65, envMapIntensity: 0.4 },
  "wood-dark":      { name: "Wood (Dark Walnut)",color: "#3e2723", metalness: 0.0, roughness: 0.55, envMapIntensity: 0.3 },
  "wood-light":     { name: "Wood (Light)",      color: "#d4a76a", metalness: 0.0, roughness: 0.7,  envMapIntensity: 0.3 },
  "gold":           { name: "Gold",              color: "#d4a030", metalness: 0.95,roughness: 0.15, envMapIntensity: 1.5 },
  "gold-matte":     { name: "Gold (Matte)",      color: "#c49525", metalness: 0.85,roughness: 0.35, envMapIntensity: 1.0 },
  "rose-gold":      { name: "Rose Gold",         color: "#b76e79", metalness: 0.9, roughness: 0.2,  envMapIntensity: 1.3 },
  "chrome":         { name: "Chrome",            color: "#e8e8e8", metalness: 1.0, roughness: 0.05, envMapIntensity: 2.0 },
  "brushed-steel":  { name: "Brushed Steel",     color: "#c0c0c0", metalness: 0.9, roughness: 0.3,  envMapIntensity: 1.2 },
  "copper":         { name: "Copper",            color: "#b87333", metalness: 0.85,roughness: 0.25, envMapIntensity: 1.4 },
  "fabric-red":     { name: "Fabric (Red)",      color: "#8b1a1a", metalness: 0.0, roughness: 0.9,  envMapIntensity: 0.2 },
  "fabric-blue":    { name: "Fabric (Navy)",     color: "#1a1a4b", metalness: 0.0, roughness: 0.9,  envMapIntensity: 0.2 },
  "fabric-green":   { name: "Fabric (Emerald)",  color: "#0d5c2e", metalness: 0.0, roughness: 0.85, envMapIntensity: 0.2 },
  "fabric-gold":    { name: "Fabric (Gold)",     color: "#c9a227", metalness: 0.05,roughness: 0.8,  envMapIntensity: 0.3 },
  "velvet-purple":  { name: "Velvet (Purple)",   color: "#4a0e4e", metalness: 0.0, roughness: 0.95, envMapIntensity: 0.15 },
  "satin-ivory":    { name: "Satin (Ivory)",     color: "#fffff0", metalness: 0.05,roughness: 0.4,  envMapIntensity: 0.6 },
  "glass-clear":    { name: "Glass (Clear)",     color: "#ffffff", metalness: 0.1, roughness: 0.05, opacity: 0.3, transparent: true, envMapIntensity: 1.5 },
  "glass-frosted":  { name: "Glass (Frosted)",   color: "#e8e8e8", metalness: 0.05,roughness: 0.4,  opacity: 0.5, transparent: true, envMapIntensity: 0.8 },
  "glass-tinted":   { name: "Glass (Tinted)",    color: "#88aacc", metalness: 0.1, roughness: 0.1,  opacity: 0.4, transparent: true, envMapIntensity: 1.2 },
  "concrete":       { name: "Concrete",          color: "#9e9e9e", metalness: 0.0, roughness: 0.85, envMapIntensity: 0.2 },
  "concrete-dark":  { name: "Concrete (Dark)",   color: "#616161", metalness: 0.0, roughness: 0.8,  envMapIntensity: 0.15 },
  "ceramic-white":  { name: "Ceramic (White)",   color: "#f5f5f5", metalness: 0.05,roughness: 0.3,  envMapIntensity: 0.7 },
  "ceramic-black":  { name: "Ceramic (Black)",   color: "#1a1a1a", metalness: 0.1, roughness: 0.25, envMapIntensity: 0.8 },
  "plastic-white":  { name: "Plastic (White)",   color: "#f0f0f0", metalness: 0.0, roughness: 0.5,  envMapIntensity: 0.3 },
  "leather-brown":  { name: "Leather (Brown)",   color: "#5c3317", metalness: 0.0, roughness: 0.7,  envMapIntensity: 0.2 },
  "leather-black":  { name: "Leather (Black)",   color: "#1c1c1c", metalness: 0.0, roughness: 0.65, envMapIntensity: 0.25 },
  "neon-pink":      { name: "Neon (Pink)",       color: "#ff1493", metalness: 0.0, roughness: 0.3,  emissive: "#ff1493", emissiveIntensity: 2.0 },
  "neon-blue":      { name: "Neon (Blue)",       color: "#00bfff", metalness: 0.0, roughness: 0.3,  emissive: "#00bfff", emissiveIntensity: 2.0 },
  "neon-gold":      { name: "Neon (Gold)",       color: "#ffd700", metalness: 0.0, roughness: 0.3,  emissive: "#ffd700", emissiveIntensity: 1.5 },
  "led-white":      { name: "LED (White)",       color: "#ffffff", metalness: 0.0, roughness: 0.5,  emissive: "#ffffff", emissiveIntensity: 0.8 },
};

export const FLOOR_MATERIALS: Record<string, MaterialPreset> = {
  "marble":   MATERIAL_PRESETS["marble-white"],
  "wood":     MATERIAL_PRESETS["wood-oak"],
  "concrete": MATERIAL_PRESETS["concrete"],
  "dark":     MATERIAL_PRESETS["marble-dark"],
  "ceramic":  MATERIAL_PRESETS["ceramic-white"],
};

export function makeThreeMaterial(preset: MaterialPreset): THREE.MeshStandardMaterialProps {
  return {
    color: preset.color,
    metalness: preset.metalness,
    roughness: preset.roughness,
    transparent: preset.transparent ?? false,
    opacity: preset.opacity ?? 1,
    envMapIntensity: preset.envMapIntensity ?? 1,
    emissive: preset.emissive ?? "#000000",
    emissiveIntensity: preset.emissiveIntensity ?? 0,
  };
}
