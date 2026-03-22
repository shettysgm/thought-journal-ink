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
import { scheduleStreakReminder } from "@/lib/notifications";

const queryClient = new QueryClient();

const App = () => {
  const { loadSettings, updateSettings, appLockEnabled, unlocked, loading, reminderAutoScheduled, reminderTime } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-schedule a default 9AM daily reminder on first launch (native only)
  useEffect(() => {
    if (loading) return;
    if (reminderAutoScheduled) return;
    scheduleStreakReminder(9, 0).then((success) => {
      // Only mark as scheduled if it actually worked (native + permission granted)
      if (success) {
        updateSettings({ reminderAutoScheduled: true, reminderTime: '09:00' });
      }
    });
  }, [loading, reminderAutoScheduled, updateSettings]);

  // Re-lock app when user leaves and returns (background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && appLockEnabled) {
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
