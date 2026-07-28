import React from "react";
import { useStudioStore } from "../stores/uiStore";
import { FLOOR_MATERIALS } from "../materials";
import * as THREE from "three";

interface VenueFloorProps {
  width: number;
  height: number;
  showGrid?: boolean;
}

export default function VenueFloor({ width, height, showGrid }: VenueFloorProps) {
  const { floorMaterial, showShadows } = useStudioStore();
  const preset = FLOOR_MATERIALS[floorMaterial] || FLOOR_MATERIALS["marble"];
  const sw = width * 0.05;
  const sh = height * 0.05;

  return (
    <group>
      {/* Main floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[sw / 2, -0.01, sh / 2]}
        receiveShadow={showShadows}
      >
        <planeGeometry args={[sw, sh]} />
        <meshStandardMaterial
          color={preset.color}
          metalness={Math.min(preset.metalness + 0.05, 0.4)}
          roughness={Math.max(preset.roughness - 0.05, 0.15)}
          envMapIntensity={preset.envMapIntensity + 0.2}
        />
      </mesh>

      {/* Grid overlay */}
      {showGrid && (
        <gridHelper
          args={[Math.max(sw, sh), Math.max(sw, sh) / 0.5, "#e2e8f0", "#e2e8f0"]}
          position={[sw / 2, 0.001, sh / 2]}
          material-opacity={0.3}
          material-transparent
        />
      )}

      {/* Subtle floor border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sw / 2, -0.02, sh / 2]}>
        <planeGeometry args={[sw + 0.2, sh + 0.2]} />
        <meshStandardMaterial color="#d4c5a9" metalness={0} roughness={0.9} />
      </mesh>
    </group>
  );
}
