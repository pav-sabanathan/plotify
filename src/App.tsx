import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShowsProvider } from "./context/ShowsContext";
import { CustomServicesProvider } from "./context/CustomServicesContext";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import ShowDetailPanel from "./components/ShowDetailPanel";
import Index from "./pages/Index";
import MyShows from "./pages/MyShows";
import AddShow from "./pages/AddShow";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import { useEffect } from "react";
import { initPostHog } from "./lib/posthog";

const queryClient = new QueryClient();

const STORAGE_KEY = 'plotify-shows';

const hasExistingShows = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch { return false; }
};

const AppShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <AppHeader />
    {children}
    <BottomNav />
  </div>
);

const App = () => {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShowsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing page — skip if returning user */}
              <Route
                path="/"
                element={hasExistingShows() ? <Navigate to="/home" replace /> : <LandingPage />}
              />
              {/* App routes */}
              <Route path="/home" element={<AppShell><Index /></AppShell>} />
              <Route path="/my-shows" element={<AppShell><MyShows /></AppShell>} />
              <Route path="/add" element={<AppShell><AddShow /></AppShell>} />
              <Route path="/privacy" element={<AppShell><Privacy /></AppShell>} />
              <Route path="/terms" element={<AppShell><Terms /></AppShell>} />
              <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
              <Route path="*" element={<AppShell><NotFound /></AppShell>} />
            </Routes>
            <ShowDetailPanel />
          </BrowserRouter>
        </ShowsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
