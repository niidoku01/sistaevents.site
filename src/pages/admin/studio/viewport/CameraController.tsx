import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_PRESETS, VENUE_W, VENUE_H } from "../cameraPresets";
import { useStudioStore } from "../stores/uiStore";

const SCALE = 0.05;

interface CameraControllerProps {
  rotateX?: number;
  rotateZ?: number;
}

export default function CameraController({ rotateX, rotateZ }: CameraControllerProps) {
  const { activePreset, cameraMode } = useStudioStore();
  const preset = CAMERA_PRESETS.find((p) => p.id === activePreset) || CAMERA_PRESETS[2];
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const animating = useRef(false);
  const targetPos = useRef(new THREE.Vector3(...preset.position));
  const targetLook = useRef(new THREE.Vector3(...preset.target));

  const usePlannerCamera = rotateX !== undefined && rotateZ !== undefined;

  // Planner camera: compute position from tilt (rotateX) and rotation (rotateZ)
  useEffect(() => {
    if (!usePlannerCamera) return;
    const distance = 18;
    const tiltRad = (rotateX * Math.PI) / 180;
    const rotRad = (rotateZ * Math.PI) / 180;
    const cx = VENUE_W * SCALE / 2;
    const cz = VENUE_H * SCALE / 2;
    const y = distance * Math.sin(tiltRad);
    const horizontalDist = distance * Math.cos(tiltRad);
    const x = cx + horizontalDist * Math.sin(rotRad);
    const z = cz + horizontalDist * Math.cos(rotRad);
    targetPos.current.set(x, y, z);
    targetLook.current.set(cx, 0, cz);
    animating.current = true;
  }, [rotateX, rotateZ, usePlannerCamera]);

  // Studio camera: animate to preset
  useEffect(() => {
    if (usePlannerCamera) return;
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);
    animating.current = true;
  }, [activePreset, preset, usePlannerCamera]);

  useFrame(() => {
    if (!animating.current) return;
    const speed = 0.08;
    camera.position.lerp(targetPos.current, speed);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, speed);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      animating.current = false;
    }
  });

  const fov = usePlannerCamera ? 50 : preset.fov;

  return (
    <>
      <PerspectiveCamera makeDefault fov={fov} position={usePlannerCamera ? [0, 15, 15] : preset.position} />
      <OrbitControls
        ref={controlsRef}
        target={usePlannerCamera ? [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2] : preset.target}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={50}
        maxPolarAngle={cameraMode === "walkthrough" ? Math.PI / 2.1 : Math.PI / 2.01}
        minPolarAngle={0.1}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
        enableZoom
        zoomSpeed={0.8}
      />
    </>
  );
}
