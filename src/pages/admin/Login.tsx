import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, initError } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/bookings");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to login";
      setError(message);
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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 24 }}>
      <Card style={{ width: "100%", maxWidth: 600 }}>
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>{initError ? "Firebase not configured" : "Sign in to access the admin dashboard"}</CardDescription>
        </CardHeader>
        <CardContent>
          {initError && (
            <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "#fee", border: "1px solid #f99", borderRadius: "4px", color: "#c00" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>Firebase Configuration Error</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Admin features require Firebase environment variables to be set:</p>
              <ul style={{ margin: "8px 0 0 20px", fontSize: "14px" }}>
                <li>VITE_FIREBASE_API_KEY</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>VITE_FIREBASE_PROJECT_ID</li>
                <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>VITE_FIREBASE_APP_ID</li>
              </ul>
              <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Add these to your .env file or environment variables and restart the app.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", marginBottom: 8 }}>Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mail.com"
                required
                disabled={!!initError}
              />
            </div>
            <div>
              <label htmlFor="password" style={{ display: "block", marginBottom: 8 }}>Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••"
                required
                disabled={!!initError}
              />
            </div>
            {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
            <Button type="submit" disabled={loading || !!initError}>
              {loading ? "Signing you in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
