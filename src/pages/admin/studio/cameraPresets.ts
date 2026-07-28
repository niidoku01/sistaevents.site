export interface CameraPreset {
  id: string;
  label: string;
  icon: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  walkthrough?: boolean;
  description: string;
}

export const VENUE_W = 1200;
export const VENUE_H = 800;
const SCALE = 0.05;

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "isometric",
    label: "Isometric",
    icon: "📐",
    position: [30, 25, 30],
    target: [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2],
    fov: 35,
    description: "Classic isometric overview",
  },
  {
    id: "birdsEye",
    label: "Bird's Eye",
    icon: "🦅",
    position: [VENUE_W * SCALE / 2, 30, VENUE_H * SCALE / 2],
    target: [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2],
    fov: 50,
    description: "Top-down view of entire venue",
  },
  {
    id: "perspective",
    label: "Perspective",
    icon: "👁️",
    position: [15, 10, 15],
    target: [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2],
    fov: 60,
    description: "Natural perspective view",
  },
  {
    id: "walkthrough",
    label: "Walkthrough",
    icon: "🚶",
    position: [3, 1.7, 3],
    target: [VENUE_W * SCALE / 2, 1.5, VENUE_H * SCALE / 2],
    fov: 75,
    walkthrough: true,
    description: "Walk through the venue at eye level",
  },
  {
    id: "drone",
    label: "Drone",
    icon: "🚁",
    position: [VENUE_W * SCALE / 2, 15, VENUE_H * SCALE / 2 + 12],
    target: [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2],
    fov: 45,
    description: "Aerial drone shot",
  },
  {
    id: "guestSeat",
    label: "Guest Seat",
    icon: "💺",
    position: [12, 1.2, 10],
    target: [VENUE_W * SCALE / 2, 1, VENUE_H * SCALE * 0.3],
    fov: 90,
    description: "View from a guest's seat",
  },
  {
    id: "stageView",
    label: "Stage View",
    icon: "🎭",
    position: [VENUE_W * SCALE / 2, 2, 2],
    target: [VENUE_W * SCALE / 2, 1.5, VENUE_H * SCALE * 0.7],
    fov: 60,
    description: "View from the stage toward guests",
  },
  {
    id: "decoratorView",
    label: "Decorator",
    icon: "🎨",
    position: [VENUE_W * SCALE / 2, 18, 15],
    target: [VENUE_W * SCALE / 2, 0, VENUE_H * SCALE / 2],
    fov: 40,
    description: "Overview focused on decor placement",
  },
];

export function venueToWorld(vx: number, vy: number): [number, number, number] {
  return [vx * SCALE, 0, vy * SCALE];
}
