import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";

type RootErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected application error",
    };
  }

  override componentDidCatch(error: unknown) {
    console.error("Root render error:", error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>App failed to load</h1>
          <p style={{ color: "#666" }}>A runtime error occurred. Check browser console for details.</p>
          <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#b00020" }}>{this.state.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim() || "http://localhost:8080";

let convex: ConvexReactClient | null = null;
try {
  convex = new ConvexReactClient(convexUrl);
} catch (error) {
  console.error("Failed to create Convex client. Check VITE_CONVEX_URL.", error);
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    {convex ? (
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    ) : (
      <div style={{ minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>App failed to load</h1>
        <p style={{ color: "#666" }}>Convex client unavailable. Set `VITE_CONVEX_URL` or start a local Convex dev server.</p>
      </div>
    )}
  </RootErrorBoundary>
);
