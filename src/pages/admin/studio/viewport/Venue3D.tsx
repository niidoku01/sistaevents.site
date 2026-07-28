import React, { Suspense, useRef, useCallback, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import CameraController from "./CameraController";
import CameraToolbar from "./CameraToolbar";
import LightingRig from "./LightingRig";
import VenueEnvironment from "./VenueEnvironment";
import VenueFloor from "./VenueFloor";
import Element3D from "./Element3D";
import { useStudioStore } from "../stores/uiStore";

const VENUE_W = 1200;
const VENUE_H = 800;

interface PlacedElement {
  id: string; type: string; x: number; y: number;
  width: number; height: number; rotation: number;
  label?: string; color?: string; guests?: number; zIndex?: number;
}

interface Venue3DProps {
  elements: PlacedElement[];
  rotateX?: number;
  rotateZ?: number;
  showStudioControls?: boolean;
  onScreenshotReady?: (takeScreenshot: () => string) => void;
}

function LoadingFallback() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#c4b5fd" />
    </group>
  );
}

function ScreenshotCapture({ onReady }: { onReady: (fn: () => string) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const takeScreenshot = () => {
      gl.render(gl.domElement as any);
      return gl.domElement.toDataURL("image/png");
    };
    onReady(takeScreenshot);
  }, [gl, onReady]);
  return null;
}

export default function Venue3D({ elements, rotateX, rotateZ, showStudioControls = true, onScreenshotReady }: Venue3DProps) {
  const { showShadows, showGrid3D } = useStudioStore();
  const sw = VENUE_W * 0.05;
  const sh = VENUE_H * 0.05;

  return (
    <div className="w-full h-full relative">
      {showStudioControls && <CameraToolbar />}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.3,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        style={{ background: "linear-gradient(180deg, #1e1528 0%, #120e18 40%, #0a0810 100%)" }}
      >
        <CameraController rotateX={rotateX} rotateZ={rotateZ} />

        {onScreenshotReady && <ScreenshotCapture onReady={onScreenshotReady} />}

        <Suspense fallback={<LoadingFallback />}>
          <VenueEnvironment />
        </Suspense>

        <LightingRig venueW={VENUE_W} venueH={VENUE_H} />
        <VenueFloor width={VENUE_W} height={VENUE_H} showGrid={showGrid3D} />

        {/* Venue boundary walls */}
        <mesh position={[sw / 2, 0.5, 0]} castShadow>
          <boxGeometry args={[sw, 1, 0.05]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0} roughness={0.9} transparent opacity={0.15} />
        </mesh>
        <mesh position={[sw / 2, 0.5, sh]} castShadow>
          <boxGeometry args={[sw, 1, 0.05]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0} roughness={0.9} transparent opacity={0.15} />
        </mesh>
        <mesh position={[0, 0.5, sh / 2]} castShadow>
          <boxGeometry args={[0.05, 1, sh]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0} roughness={0.9} transparent opacity={0.15} />
        </mesh>
        <mesh position={[sw, 0.5, sh / 2]} castShadow>
          <boxGeometry args={[0.05, 1, sh]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0} roughness={0.9} transparent opacity={0.15} />
        </mesh>

        {/* Elements */}
        {elements.map((el) => (
          <Element3D
            key={el.id}
            type={el.type}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            rotation={el.rotation}
            color={el.color}
            guests={el.guests}
            label={el.label}
          />
        ))}

        {/* Contact shadows */}
        {showShadows && (
          <ContactShadows
            position={[sw / 2, 0, sh / 2]}
            opacity={0.3}
            scale={Math.max(sw, sh) * 1.2}
            blur={2}
            far={4}
            color="#000000"
          />
        )}
      </Canvas>
    </div>
  );
}
