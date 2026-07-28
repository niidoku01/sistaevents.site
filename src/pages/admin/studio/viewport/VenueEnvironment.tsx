import React from "react";
import { Environment as DreiEnvironment } from "@react-three/drei";
import { useStudioStore } from "../stores/uiStore";

export default function VenueEnvironment() {
  const { envIntensity } = useStudioStore();
  return (
    <DreiEnvironment
      environmentIntensity={envIntensity}
      backgroundBlurriness={1}
      background={false}
    >
      <mesh scale={[100, 100, 100]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#2a1f35" side={1} />
      </mesh>
      <mesh position={[0, 20, 0]} scale={[80, 80, 80]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#4a3f5a" side={1} />
      </mesh>
      <mesh position={[0, -5, 0]} scale={[100, 2, 100]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#f5efe6" side={1} />
      </mesh>
      <pointLight position={[10, 15, 10]} intensity={80} color="#ffe8cc" distance={40} />
      <pointLight position={[-10, 12, -8]} intensity={50} color="#ffeedd" distance={35} />
      <pointLight position={[0, 18, 0]} intensity={40} color="#e8dff5" distance={50} />
    </DreiEnvironment>
  );
}
