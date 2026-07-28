import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLoadingFallback } from "@/components/AppLoadingFallback";
import { ScrollToTop } from "@/components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const OurCollection = lazy(() => import("./pages/Gallery"));
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

const MINIMUM_SPLASH_MS = 1200;
const MAXIMUM_SPLASH_MS = 4000;

const App = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const start = performance.now();

    const preload = async () => {
      await Promise.allSettled([
        import("./pages/Index"),
        import("./pages/Gallery"),
        import("./pages/admin/AdminShell"),
      ]);
    };

    preload().then(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(MINIMUM_SPLASH_MS - elapsed, 0);
      setTimeout(() => setShowContent(true), remaining);
    });

    const safetyTimer = setTimeout(() => setShowContent(true), MAXIMUM_SPLASH_MS);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (!showContent) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppLoadingFallback />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<AppLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/our-collection" element={<OurCollection />} />
              <Route path="/admin/*" element={<AdminShell />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
