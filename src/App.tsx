import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import OfflineBanner from "@/components/ui/OfflineBanner";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import PlanReady from "./pages/PlanReady";
import Paywall from "./pages/Paywall";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/Progress";
import Scanner from "./pages/Scanner";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NutritionGoals from "./pages/NutritionGoals";
import Notifications from "./pages/Notifications";
import EmailPreferences from "./pages/EmailPreferences";
import Milestones from "./pages/Milestones";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <OnboardingProvider>
          <OfflineBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/plan-ready" element={<PlanReady />} />
              <Route path="/paywall" element={<Paywall />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/nutrition-goals" element={<NutritionGoals />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/email-preferences" element={<EmailPreferences />} />
              <Route path="/milestones" element={<Milestones />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OnboardingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
