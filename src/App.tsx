import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { AppLoadingFallback } from "@/components/AppLoadingFallback";
import { ScrollToTop } from "@/components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const OurCollection = lazy(() => import("./pages/Gallery"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminShell = lazy(() => import("./pages/admin/AdminShell"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MINIMUM_SPLASH_MS = 600;
const MAXIMUM_SPLASH_MS = 4000;
const GALLERY_PREWARM_MS = 5 * 60 * 1000;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Keeps the collection queries warm in the Convex client cache.
 *
 * The gallery previously fetched its data with one-off HTTP queries on mount.
 * Prewarming over the existing Convex websocket means that by the time a
 * visitor opens /our-collection the data (and the admin-defined order) is
 * already local, so the page renders without waiting on the network.
 */
const GalleryDataPrewarm = () => {
  const convex = useConvex();

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return;

    let cancelled = false;

    const prewarm = () => {
      if (cancelled) return;
      convex.prewarmQuery({
        query: api.collectionImages.listImages,
        args: {},
        extendSubscriptionFor: GALLERY_PREWARM_MS,
      });
      convex.prewarmQuery({
        query: api.collectionLayout.getLayout,
        args: {},
        extendSubscriptionFor: GALLERY_PREWARM_MS,
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prewarm, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(prewarm, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [convex]);

  return null;
};

const App = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const start = performance.now();

    const preload = async () => {
      const path = window.location.pathname;
      const routeChunk = path.startsWith("/admin")
        ? import("./pages/admin/AdminShell")
        : path.startsWith("/our-collection")
          ? import("./pages/Gallery")
          : path.startsWith("/privacy-policy")
            ? import("./pages/PrivacyPolicy")
            : path === "/" || path === ""
              ? import("./pages/Index")
              : import("./pages/NotFound");

      const chunks = [routeChunk];
      // Preload the gallery on the homepage so opening the collection is instant,
      // but keep the admin bundle out of the public critical path.
      if (path === "/" || path === "") {
        chunks.push(import("./pages/Gallery"));
      }

      await Promise.allSettled(chunks);
    };

    preload().then(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(MINIMUM_SPLASH_MS - elapsed, 0);
      setTimeout(() => setShowContent(true), remaining);
    });

    const safetyTimer = setTimeout(() => setShowContent(true), MAXIMUM_SPLASH_MS);
    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GalleryDataPrewarm />
      {showContent ? (
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<AppLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/our-collection" element={<OurCollection />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/admin/*" element={<AdminShell />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      ) : (
        <AppLoadingFallback />
      )}
    </QueryClientProvider>
  );
};

export default App;
