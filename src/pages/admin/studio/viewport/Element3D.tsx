import React, { useMemo } from "react";
import * as THREE from "three";
import { useStudioStore } from "../stores/uiStore";

const S = 0.05;

interface Element3DProps {
  type: string;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  color?: string;
  guests?: number;
  label?: string;
  selected?: boolean;
}

function RoundTable({ width, height, color, guests = 10, label }: { width: number; height: number; color?: string; guests?: number; label?: string }) {
  const r = (Math.min(width, height) / 2) * S;
  const chairR = r * 1.4;
  return (
    <group>
      {/* Table top */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.04, 32]} />
        <meshStandardMaterial color="#faf7f0" metalness={0.05} roughness={0.3} envMapIntensity={0.8} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.375, 0]} castShadow>
        <cylinderGeometry args={[r * 0.08, r * 0.12, 0.75, 12]} />
        <meshStandardMaterial color="#d4c5a9" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Table base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[r * 0.35, r * 0.35, 0.04, 16]} />
        <meshStandardMaterial color="#d4c5a9" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Tablecloth edge */}
      <mesh position={[0, 0.73, 0]}>
        <cylinderGeometry args={[r + 0.02, r + 0.04, 0.08, 32]} />
        <meshStandardMaterial color="#fff8ee" metalness={0} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Chairs */}
      {Array.from({ length: guests }, (_, i) => {
        const angle = (i / guests) * Math.PI * 2;
        const cx = Math.cos(angle) * chairR;
        const cz = Math.sin(angle) * chairR;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, -angle + Math.PI / 2, 0]}>
            {/* Seat */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.22, 0.03, 0.22]} />
              <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Back */}
            <mesh position={[0, 0.6, -0.1]} castShadow>
              <boxGeometry args={[0.22, 0.3, 0.02]} />
              <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Legs */}
            {[[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, 0.22, lz]} castShadow>
                <cylinderGeometry args={[0.008, 0.008, 0.44, 6]} />
                <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function RectTable({ width, height, color, guests = 8 }: { width: number; height: number; color?: string; guests?: number }) {
  const w = width * S * 0.85, d = height * S * 0.5, th = 0.75;
  return (
    <group>
      <mesh position={[0, th, 0]} castShadow>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial color="#faf7f0" metalness={0.05} roughness={0.3} />
      </mesh>
      {[[-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05], [-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, th / 2, lz]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, th, 8]} />
          <meshStandardMaterial color="#d4c5a9" metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: Math.ceil(guests / 2) }, (_, i) => {
        const spacing = w / (Math.ceil(guests / 2) + 1);
        const cx = -w / 2 + spacing * (i + 1);
        return (
          <group key={`t${i}`} position={[cx, 0, -d / 2 - 0.2]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.2, 0.03, 0.2]} />
              <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.6, -0.09]} castShadow>
              <boxGeometry args={[0.2, 0.25, 0.02]} />
              <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: Math.floor(guests / 2) }, (_, i) => {
        const spacing = w / (Math.floor(guests / 2) + 1);
        const cx = -w / 2 + spacing * (i + 1);
        return (
          <group key={`b${i}`} position={[cx, 0, d / 2 + 0.2]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.2, 0.03, 0.2]} />
              <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Chair({ color }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.03, 0.22]} />
        <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, -0.1]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.02]} />
        <meshStandardMaterial color={color || "#d4a030"} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Stage({ width, height }: { width: number; height: number }) {
  const w = width * S, d = height * S;
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.5, d]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, d * 0.4]} castShadow>
        <boxGeometry args={[w, 0.04, d * 0.2]} />
        <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Steps */}
      <mesh position={[0, 0.08, d / 2 + 0.15]} castShadow>
        <boxGeometry args={[w * 0.6, 0.16, 0.3]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.1} roughness={0.6} />
      </mesh>
    </group>
  );
}

function DanceFloorMesh({ width, height }: { width: number; height: number }) {
  const w = width * S, d = height * S;
  const tileCount = Math.floor(Math.max(w, d) / 0.3);
  return (
    <group>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[w, 0.01, d]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.4} />
      </mesh>
      {Array.from({ length: tileCount }, (_, r) =>
        Array.from({ length: tileCount }, (_, c) => (
          <mesh key={`${r}-${c}`} position={[(c - tileCount / 2) * 0.3 + 0.15, 0.012, (r - tileCount / 2) * 0.3 + 0.15]} receiveShadow>
            <boxGeometry args={[0.28, 0.005, 0.28]} />
            <meshStandardMaterial
              color={(r + c) % 2 === 0 ? "#111827" : "#d1d5db"}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

function Backdrop({ width, height, color }: { width: number; height: number; color?: string }) {
  const w = width * S, h = height * S || 0.5;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color={color || "#7c3aed"} metalness={0.1} roughness={0.7} />
      </mesh>
      {/* Drapes */}
      {Array.from({ length: Math.floor(w / 0.15) }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.075 + i * 0.15, h / 2, 0.05]} castShadow>
          <boxGeometry args={[0.1, h * 0.95, 0.02]} />
          <meshStandardMaterial color="#ede9fe" metalness={0} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Arch({ width, height, color }: { width: number; height: number; color?: string }) {
  const w = width * S, h = height * S || 0.8;
  return (
    <group>
      {/* Left pillar */}
      <mesh position={[-w / 2 + 0.05, h / 2, 0]} castShadow>
        <boxGeometry args={[0.1, h, 0.1]} />
        <meshStandardMaterial color={color || "#be185d"} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[w / 2 - 0.05, h / 2, 0]} castShadow>
        <boxGeometry args={[0.1, h, 0.1]} />
        <meshStandardMaterial color={color || "#be185d"} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Top arch */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w + 0.1, 0.08, 0.12]} />
        <meshStandardMaterial color={color || "#be185d"} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Flowers on arch */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + w * (i / 4), h + 0.06, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#e11d48" metalness={0} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Wall({ width, height }: { width: number; height: number }) {
  const w = width * S;
  return (
    <mesh position={[0, 0.25, 0]} castShadow>
      <boxGeometry args={[w, 0.5, 0.08]} />
      <meshStandardMaterial color="#334155" metalness={0.1} roughness={0.7} />
    </mesh>
  );
}

function Canopy({ width, height }: { width: number; height: number }) {
  const w = width * S, d = height * S;
  return (
    <group>
      {/* Poles */}
      {[[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.5, pz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 3, 8]} />
          <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Canopy top */}
      <mesh position={[0, 2.95, 0]} castShadow>
        <boxGeometry args={[w + 0.2, 0.04, d + 0.2]} />
        <meshStandardMaterial color="#e0f2fe" metalness={0} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GenericBox({ width, height, color, metalness = 0.1, roughness = 0.6 }: { width: number; height: number; color?: string; metalness?: number; roughness?: number }) {
  const w = width * S, d = height * S;
  const h = Math.max(0.3, Math.min(w, d) * 0.5);
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color || "#9ca3af"} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function FlatSurface({ width, height, color, elevation = 0.01 }: { width: number; height: number; color?: string; elevation?: number }) {
  const w = width * S, d = height * S;
  return (
    <mesh position={[0, elevation, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color || "#94a3b8"} metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TallObject({ width, height, color, aspectRatio = 0.6 }: { width: number; height: number; color?: string; aspectRatio?: number }) {
  const h = height * S;
  const w = width * S;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, w * aspectRatio]} />
        <meshStandardMaterial color={color || "#9ca3af"} metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function Element3D({ type, x, y, width, height, rotation, color, guests, label }: Element3DProps) {
  const px = x * S;
  const pz = y * S;
  const ry = (rotation * Math.PI) / 180;

  const child = useMemo(() => {
    switch (type) {
      case "round-table":
        return <RoundTable width={width} height={height} color={color} guests={guests} label={label} />;
      case "rect-table":
      case "sweetheart-table":
      case "cake-table":
      case "gift-table":
      case "dessert-table":
      case "candy-bar":
      case "seminar-desk":
        return <RectTable width={width} height={height} color={color} guests={guests} />;
      case "chair":
        return <Chair color={color} />;
      case "stage":
        return <Stage width={width} height={height} />;
      case "dance-floor":
        return <DanceFloorMesh width={width} height={height} />;
      case "backdrop":
        return <Backdrop width={width} height={height} color={color} />;
      case "arch":
      case "entrance":
        return <Arch width={width} height={height} color={color} />;
      case "wall":
        return <Wall width={width} height={height} />;
      case "canopy":
        return <Canopy width={width} height={height} />;
      case "carpet":
      case "petal-aisle":
      case "path":
        return <FlatSurface width={width} height={height} color={color} />;
      case "parking":
        return <FlatSurface width={width} height={height} color="#94a3b8" />;
      case "speaker":
      case "generator":
      case "first-aid":
      case "fire-exit":
      case "power-strip":
        return <GenericBox width={width} height={height} color={color} />;
      case "bar":
      case "buffet":
      case "registration":
      case "photo-booth":
      case "dessert-table":
      case "candy-bar":
        return <GenericBox width={width} height={height} color={color} />;
      case "dj-booth":
        return (
          <group>
            <GenericBox width={width} height={height} color={color} />
            <mesh position={[0, height * S * 0.5 + 0.05, -height * S * 0.3]}>
              <boxGeometry args={[width * S * 0.6, 0.03, 0.15]} />
              <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.4} />
            </mesh>
          </group>
        );
      case "podium":
        return <TallObject width={width} height={height} color={color} />;
      case "projector-screen":
      case "banner-stand":
        return (
          <group>
            <mesh position={[0, height * S / 2, 0]} castShadow>
              <boxGeometry args={[width * S, height * S, 0.02]} />
              <meshStandardMaterial color={color || "#374151"} metalness={0.05} roughness={0.6} />
            </mesh>
          </group>
        );
      case "lighting":
      case "neon-sign":
      case "candle":
        return (
          <group>
            <GenericBox width={width} height={height} color={color} />
            <pointLight position={[0, 1, 0]} intensity={0.5} color={color || "#ffd700"} distance={3} />
          </group>
        );
      case "flower":
      case "greenery":
        return (
          <group>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[Math.min(width, height) * S * 0.4, 12, 12]} />
              <meshStandardMaterial color={color || "#16a34a"} metalness={0} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
              <meshStandardMaterial color="#65a30d" metalness={0} roughness={0.9} />
            </mesh>
          </group>
        );
      case "sofa":
        return (
          <group>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[width * S, 0.4, height * S]} />
              <meshStandardMaterial color={color || "#92400e"} metalness={0} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.45, -height * S * 0.35]} castShadow>
              <boxGeometry args={[width * S, 0.15, height * S * 0.25]} />
              <meshStandardMaterial color={color || "#92400e"} metalness={0} roughness={0.8} />
            </mesh>
          </group>
        );
      case "bouncy-castle":
        return (
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[width * S, 1, height * S]} />
              <meshStandardMaterial color={color || "#2563eb"} metalness={0} roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.05, 0]} castShadow>
              <boxGeometry args={[width * S * 0.8, 0.1, height * S * 0.8]} />
              <meshStandardMaterial color="#60a5fa" metalness={0} roughness={0.6} />
            </mesh>
          </group>
        );
      case "text":
      case "card-box":
      case "photo-frame":
        return <GenericBox width={width} height={height} color={color} />;
      default:
        return <GenericBox width={width} height={height} color={color} />;
    }
  }, [type, width, height, color, guests, label]);

  return (
    <group position={[px, 0, pz]} rotation={[0, ry, 0]}>
      {child}
    </group>
  );
}
