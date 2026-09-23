import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, initError } from "@/lib/firebase";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

const getLoginErrorMessage = (err: unknown): string => {
  const fallback = "Failed to login";

  if (!(err instanceof Error)) {
    return fallback;
  }

  const maybeCode = (err as { code?: string }).code;
  if (maybeCode === "auth/network-request-failed") {
    return "Network error while contacting Firebase Auth. Check internet/DNS/firewall or VPN, then ensure your current host is added to Firebase Authentication Authorized domains (include localhost for local dev).";
  }

  if (maybeCode === "auth/api-key-not-valid") {
    return "Firebase API key is invalid. Set a current Web API key from Firebase Project Settings in VITE_FIREBASE_API_KEY, then restart or redeploy the app.";
  }

  if (maybeCode === "auth/invalid-credential") {
    return "Invalid email or password.";
  }

  return err.message || fallback;
};

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authUnavailable = !auth || !!initError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet and try again.");
      return;
    }

    if (!auth) {
      setError("Firebase Auth not initialized. ");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        setAuthToken(token);
      }
      navigate("/admin/bookings");
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow blobs behind the glass card */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-slate-300/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-44 h-44 rounded-full bg-amber-100/60 blur-2xl" />

      <div className="glass-login relative w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-[1.6rem] font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent tracking-tight">
            Admin Dashboard
          </h1>
        </div>

        {initError && (
          <div className="rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm p-4 mb-6">
            <p className="font-semibold text-red-900 text-sm mb-2">Firebase Configuration Error</p>
            <p className="text-xs text-red-800 mb-3">Set the Firebase Web app configuration in your environment. The API key must be a current key beginning with <code>AIza</code>, not a placeholder.</p>
            <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
            <p className="text-xs text-red-800 mt-3">Update <code>VITE_FIREBASE_API_KEY</code> in local .env files or Vercel environment variables, then restart or redeploy.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-800">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={authUnavailable}
              className="h-11 rounded-xl bg-white/70 border-slate-200/70 backdrop-blur-sm focus:border-amber-500 focus:ring-amber-500/25 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={authUnavailable}
                className="h-11 rounded-xl bg-white/70 border-slate-200/70 backdrop-blur-sm focus:border-amber-500 focus:ring-amber-500/25 placeholder:text-slate-400 pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm p-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || authUnavailable}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;