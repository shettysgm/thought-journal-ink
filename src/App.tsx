import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./router";
import CrisisResourcesBanner from "@/components/CrisisResourcesBanner";
import AIConsentDialog from "@/components/AIConsentDialog";
import LockScreen from "@/components/LockScreen";
import { useSettings } from "@/store/useSettings";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const { loadSettings, updateSettings, appLockEnabled, unlocked, loading } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Re-lock app when user leaves and returns (background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && appLockEnabled) {
        // Re-lock when app goes to background
        useSettings.setState({ unlocked: false });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [appLockEnabled]);

  const handleAIConsentGiven = () => {
    updateSettings({ aiAnalysisEnabled: true });
  };

  const handleAIConsentDeclined = () => {
    updateSettings({ aiAnalysisEnabled: false });
  };

  // Show lock screen if app lock is enabled and not yet unlocked
  if (appLockEnabled && !unlocked && !loading) {
    return <LockScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CrisisResourcesBanner />
        <Toaster />
        <Sonner />
        <AIConsentDialog
          onConsentGiven={handleAIConsentGiven}
          onConsentDeclined={handleAIConsentDeclined}
        />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
