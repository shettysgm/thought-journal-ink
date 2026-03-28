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

  // Schedule daily reminder on every app launch (native only)
  // Re-registers the notification in case iOS cleared it (reboot, update, etc.)
  useEffect(() => {
    if (loading) return;

    if (reminderTime) {
      // Re-schedule existing reminder every launch
      const [h, m] = reminderTime.split(':').map(Number);
      scheduleStreakReminder(h, m);
    } else if (!reminderAutoScheduled) {
      // First launch: try default 9AM
      scheduleStreakReminder(9, 0).then((success) => {
        if (success) {
          updateSettings({ reminderAutoScheduled: true, reminderTime: '09:00' });
        }
      });
    }
  }, [loading, reminderAutoScheduled, reminderTime, updateSettings]);

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
