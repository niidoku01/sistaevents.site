import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, initError } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const getLoginErrorMessage = (err: unknown): string => {
  const fallback = "Failed to login";

  if (!(err instanceof Error)) {
    return fallback;
  }

  const maybeCode = (err as { code?: string }).code;
  if (maybeCode === "auth/network-request-failed") {
    return "Network error while contacting Firebase Auth. Check internet/DNS/firewall or VPN, then ensure your current host is added to Firebase Authentication Authorized domains (include localhost for local dev).";
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
      setError("Firebase Auth is not initialized. Verify your Firebase environment variables and restart the app.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/bookings");
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
      // Log failed login attempt
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "admin_login_failed", email, time: new Date().toISOString() })
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Admin Dashboard</CardTitle>
          <CardDescription className="text-sm">{initError ? "⚠️ Firebase configuration required" : "Sign in to your admin account"}</CardDescription>
        </CardHeader>
        <CardContent>
          {initError && (
            <div className="rounded-lg border border-red-200/60 bg-red-50/80 p-4 mb-6">
              <p className="font-semibold text-red-900 text-sm mb-2">Firebase Configuration Error</p>
              <p className="text-xs text-red-800 mb-3">Admin features require these environment variables:</p>
              <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>VITE_FIREBASE_PROJECT_ID</li>
                <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>VITE_FIREBASE_APP_ID</li>
              </ul>
              <p className="text-xs text-red-800 mt-3">Add these to your .env file and restart the app.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-900">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={authUnavailable}
                className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-900">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={authUnavailable}
                  className="rounded-lg border-slate-200/60 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200/60 bg-red-50/80 p-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            <Button 
              type="submit" 
              disabled={loading || authUnavailable}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
