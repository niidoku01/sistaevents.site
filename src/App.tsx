import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLoadingFallback } from "@/components/AppLoadingFallback";
import { ScrollToTop } from "@/components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const OurCollection = lazy(() => import("./pages/Gallery"));
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

const App = () => (
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
