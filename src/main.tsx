import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")!).render(
  <>
    {convex ? (
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    ) : (
      <App />
    )}
  </>
);
