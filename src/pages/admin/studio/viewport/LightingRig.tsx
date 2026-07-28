import React from "react";
import { useStudioStore } from "../stores/uiStore";

interface LightingRigProps {
  venueW: number;
  venueH: number;
}

const LIGHTING_CONFIGS = {
  setup: {
    ambient: 0.6,
    ambientColor: "#ffffff",
    directional: 0.8,
    directionalColor: "#fff5e6",
    pointCount: 4,
    pointColor: "#ffe8cc",
    pointIntensity: 0.5,
    fog: "#f0f0f0",
  },
  event: {
    ambient: 0.25,
    ambientColor: "#ffeedd",
    directional: 0.7,
    directionalColor: "#fff0d4",
    pointCount: 10,
    pointColor: "#ffcc80",
    pointIntensity: 1.2,
    fog: "#15101c",
  },
  romantic: {
    ambient: 0.1,
    ambientColor: "#ff9966",
    directional: 0.25,
    directionalColor: "#ffccaa",
    pointCount: 14,
    pointColor: "#ff7744",
    pointIntensity: 1.5,
    fog: "#0a0610",
  },
};

export default function LightingRig({ venueW, venueH }: LightingRigProps) {
  const { lightingPreset, showShadows, envIntensity } = useStudioStore();
  const config = LIGHTING_CONFIGS[lightingPreset];
  const sw = venueW * 0.05, sh = venueH * 0.05;

  const pointPositions: [number, number, number][] = React.useMemo(() => {
    const pts: [number, number, number][] = [];
    const cols = Math.ceil(Math.sqrt(config.pointCount));
    const rows = Math.ceil(config.pointCount / cols);
    for (let i = 0; i < config.pointCount; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      pts.push([
        (col + 0.5) * (sw / cols),
        4,
        (row + 0.5) * (sh / rows),
      ]);
    }
    return pts;
  }, [config.pointCount, sw, sh]);

  return (
    <>
      <ambientLight intensity={config.ambient} color={config.ambientColor} />
      <directionalLight
        position={[sw * 0.4, 12, sh * 0.3]}
        intensity={config.directional}
        color={config.directionalColor}
        castShadow={showShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-sw / 2}
        shadow-camera-right={sw / 2}
        shadow-camera-top={sh / 2}
        shadow-camera-bottom={-sh / 2}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-sw * 0.3, 8, -sh * 0.3]} intensity={config.directional * 0.3} color="#e8e0ff" />
      {pointPositions.map((pos, i) => (
        <pointLight
          key={i}
          position={pos}
          intensity={config.pointIntensity}
          color={config.pointColor}
          distance={10}
          decay={1.5}
          castShadow={showShadows && i < 2}
        />
      ))}
      <hemisphereLight
        skyColor={lightingPreset === "romantic" ? "#2a1520" : "#e8e0ff"}
        groundColor={lightingPreset === "romantic" ? "#0d0a10" : "#f5f0e8"}
        intensity={0.3}
      />
      <fog attach="fog" args={[config.fog, 20, 50]} />
    </>
  );
}
