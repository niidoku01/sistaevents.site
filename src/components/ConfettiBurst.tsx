import { useMemo } from "react";
import type { CSSProperties } from "react";

const COLORS = [
  "#f59e0b",
  "#fbbf24",
  "#f97316",
  "#ec4899",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#ef4444",
];

type ConfettiStyle = CSSProperties & {
  "--confetti-drift"?: string;
  "--confetti-spin"?: string;
  "--confetti-fall-distance"?: string;
  "--confetti-x"?: string;
  "--confetti-y"?: string;
};

type ConfettiBurstProps = {
  /** Number of pieces falling from the top of the container. */
  count?: number;
  /** How far the falling pieces travel. Use vh for full-screen overlays. */
  distance?: string;
  /** Additional classes for positioning the overlay (e.g. fixed inset-0). */
  className?: string;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const ConfettiBurst = ({
  count = 64,
  distance = "110vh",
  className = "",
}: ConfettiBurstProps) => {
  const fallingPieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const shape = index % 9 === 0 ? "circle" : index % 5 === 0 ? "ribbon" : "square";
        const size = random(7, 13);

        return {
          id: `fall-${index}`,
          left: random(0, 100),
          size,
          height: shape === "ribbon" ? size * 0.45 : size,
          color: pickColor(),
          radius: shape === "circle" ? "9999px" : "2px",
          drift: random(-200, 200),
          spin: random(-1100, 1100),
          duration: random(4200, 6200),
          delay: random(0, 700),
        };
      }),
    [count]
  );

  const burstPieces = useMemo(
    () =>
      Array.from({ length: 38 }, (_, index) => {
        const angle = (index / 38) * Math.PI * 2 + random(-0.18, 0.18);
        const radius = random(100, 340);
        const size = random(6, 12);

        return {
          id: `burst-${index}`,
          size,
          color: pickColor(),
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius + random(30, 150),
          spin: random(-950, 950),
          duration: random(1100, 1700),
          delay: random(0, 220),
          radiusCss: index % 4 === 0 ? "9999px" : "2px",
        };
      }),
    []
  );

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {burstPieces.map((piece) => (
        <span
          key={piece.id}
          className="sista-confetti-burst"
          style={
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.radiusCss,
              animationDuration: `${piece.duration}ms`,
              animationDelay: `${piece.delay}ms`,
              "--confetti-x": `${piece.x}px`,
              "--confetti-y": `${piece.y}px`,
              "--confetti-spin": `${piece.spin}deg`,
            } as ConfettiStyle
          }
        />
      ))}

      {fallingPieces.map((piece) => (
        <span
          key={piece.id}
          className="sista-confetti-fall"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.height,
              backgroundColor: piece.color,
              borderRadius: piece.radius,
              animationDuration: `${piece.duration}ms`,
              animationDelay: `${piece.delay}ms`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-spin": `${piece.spin}deg`,
              "--confetti-fall-distance": distance,
            } as ConfettiStyle
          }
        />
      ))}
    </div>
  );
};

export default ConfettiBurst;
