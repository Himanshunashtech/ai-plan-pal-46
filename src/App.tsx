import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";

import OfflineBanner from "@/components/ui/OfflineBanner";
import PublicRoute from "@/components/auth/PublicRoute";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import PlanReady from "./pages/PlanReady";
import Paywall from "./pages/Paywall";
import Subscription from "./pages/Subscription";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/Progress";
import Scanner from "./pages/Scanner";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NutritionGoals from "./pages/NutritionGoals";
import DailyBreakdown from "./pages/DailyBreakdown";
import Notifications from "./pages/Notifications";
import EmailPreferences from "./pages/EmailPreferences";
import Milestones from "./pages/Milestones";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";
import PrivacyPolicy from "./pages/PrivacyPolicy";

import { Capacitor } from '@capacitor/core';

const queryClient = new QueryClient();

const AppContent = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const location = useLocation(); // Keep track of location for animation triggering

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let activeTheme = theme;
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      activeTheme = mediaQuery.matches ? "dark" : "light";

      const applySystemTheme = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
        updateSystemBars(systemTheme);
      };

      mediaQuery.addEventListener("change", applySystemTheme);
      root.classList.add(activeTheme);
      updateSystemBars(activeTheme);
      return () => mediaQuery.removeEventListener("change", applySystemTheme);
    } else {
      root.classList.add(theme);
      updateSystemBars(theme);
    }
  }, [theme]);

  const updateSystemBars = async (currentTheme: string) => {
    const isDark = currentTheme === 'dark';

    // Update PWA Meta Theme Color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#121212' : '#fafafa');
    }

  };

  return (

    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><Splash /></PublicRoute>} />
        <Route path="/splash" element={<PublicRoute><Splash /></PublicRoute>} />
        <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<PublicRoute><Onboarding /></PublicRoute>} />
        <Route path="/plan-ready" element={<PublicRoute><PlanReady /></PublicRoute>} />

        {/* Protected */}
        <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />

        {/* Main Tabs with Transitions */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageTransition>
              <Dashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute>
            <PageTransition>
              <Progress />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition>
              <Profile />
            </PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/nutrition-goals" element={<ProtectedRoute><NutritionGoals /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/email-preferences" element={<ProtectedRoute><EmailPreferences /></ProtectedRoute>} />
        <Route path="/milestones" element={<ProtectedRoute><Milestones /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/daily-breakdown" element={<ProtectedRoute><DailyBreakdown /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>

  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <OfflineBanner />
            <Toaster />
            <Sonner />
            <AppContent />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
