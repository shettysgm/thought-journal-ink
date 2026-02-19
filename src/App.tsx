import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./router";
import CrisisResourcesBanner from "@/components/CrisisResourcesBanner";
import AIConsentDialog from "@/components/AIConsentDialog";
import { useSettings } from "@/store/useSettings";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const { loadSettings, updateSettings } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleAIConsentGiven = () => {
    updateSettings({ aiAnalysisEnabled: true });
  };

  const handleAIConsentDeclined = () => {
    updateSettings({ aiAnalysisEnabled: false });
  };
  
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
