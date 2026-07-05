import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const DIGITS = ["4", "0", "4"];
const BALLOONS = [
  { color: "from-[#FFD700] to-amber-400", delay: "0s" },
  { color: "from-amber-400 to-amber-500", delay: "0.15s" },
  { color: "from-amber-500 to-[#FFD700]", delay: "0.3s" },
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
                  <svg width="90" height="110" viewBox="0 0 90 110" className="drop-shadow-lg">
                    <defs>
                      <radialGradient id={`balloon-grad-${i}`} cx="35%" cy="30%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="45" cy="50" rx="38" ry="44" fill={`url(#balloon-grad-${i})`} />
                    <ellipse
                      cx="45" cy="50" rx="38" ry="44"
                      fill={`url(#balloon-grad-${i})`}
                      stroke={i === 1 ? "#f59e0b" : "#FFD700"}
                      strokeWidth="1.5"
                    />
                    <polygon points="45,90 39,100 51,100" fill="#d4d4d8" />
                    <path d="M45 100 Q45 108 43 114" stroke="#a1a1aa" strokeWidth="1.5" fill="none" />
                  </svg>
                  <span className="absolute text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md" style={{ top: "38%" }}>
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
