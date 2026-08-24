import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const DIGITS = ["4", "0", "4"];
const BALLOONS = [
  { light: "#fde68a", base: "#fbbf24", dark: "#d97706", delay: "0s" },
  { light: "#fcd34d", base: "#f59e0b", dark: "#b45309", delay: "0.15s" },
  { light: "#fef3c7", base: "#fbbf24", dark: "#b45309", delay: "0.3s" },
];

export default function NotFound() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="relative text-center max-w-md">
          {/* Balloons with digits */}
          <div className="flex justify-center gap-4 mb-8" style={{ perspective: "600px" }}>
            {BALLOONS.map((b, i) => (
              <div
                key={i}
                className={`transition-all duration-700 ease-out ${
                  visible ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-12"
                }`}
                style={{
                  transitionDelay: `${i * 150}ms`,
                  animation: `float 3s ease-in-out ${b.delay} infinite`,
                }}
              >
                <div className="relative flex items-center justify-center">
                  <svg width="90" height="112" viewBox="0 0 90 112" className="drop-shadow-lg">
                    <defs>
                      <radialGradient id={`balloon-body-${i}`} cx="35%" cy="28%" r="85%">
                        <stop offset="0%" stopColor={b.light} />
                        <stop offset="45%" stopColor={b.base} />
                        <stop offset="100%" stopColor={b.dark} />
                      </radialGradient>
                    </defs>
                    <ellipse cx="45" cy="48" rx="38" ry="44" fill={`url(#balloon-body-${i})`} />
                    <ellipse cx="31" cy="27" rx="9" ry="15" fill="rgba(255,255,255,0.4)" transform="rotate(-22 31 27)" />
                    <polygon points="45,90 39,99 51,99" fill={b.dark} />
                    <path d="M45 99 Q45 107 43 113" stroke="#a1a1aa" strokeWidth="1.5" fill="none" />
                  </svg>
                  <span className="absolute text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md" style={{ top: "35%" }}>
                    {DIGITS[i]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`text-lg sm:text-xl text-slate-600 transition-all duration-700 delay-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Page not found
          </p>
          <p
            className={`mt-2 text-sm text-slate-400 transition-all duration-700 delay-900 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-300/40 transition-all duration-700 delay-1000 hover:shadow-xl hover:shadow-amber-300/50 hover:scale-105 active:scale-95 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
