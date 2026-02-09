import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MobileLayout from "./components/MobileLayout";
import { Loader2 } from "lucide-react";

// Lazy load non-critical routes
const UnifiedJournalPage = lazy(() => import("./pages/UnifiedJournalPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const WhyCBTPage = lazy(() => import("./pages/WhyCBTPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Router() {
  console.log('Router component rendering');
  
  return (
    <BrowserRouter>
      <MobileLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/text" element={<UnifiedJournalPage />} />
            <Route path="/voice" element={<UnifiedJournalPage />} />
            <Route path="/unified" element={<UnifiedJournalPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/why-cbt" element={<WhyCBTPage />} />
            <Route path="/handwriting" element={<Navigate to="/text" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </MobileLayout>
    </BrowserRouter>
  );
}
