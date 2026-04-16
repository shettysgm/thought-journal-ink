import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import MobileLayout from "./components/MobileLayout";
import { AuthGuard } from "./components/AuthGuard";
import { Loader2 } from "lucide-react";

// Lazy load non-critical routes
const UnifiedJournalPage = lazy(() => import("./pages/UnifiedJournalPage"));
const BreathePage = lazy(() => import("./pages/BreathePage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const WhyCBTPage = lazy(() => import("./pages/WhyCBTPage"));
const CounselorSearchPage = lazy(() => import("./pages/CounselorSearchPage"));
const ThoughtRecordPage = lazy(() => import("./pages/ThoughtRecordPage"));
const ActivityPlanPage = lazy(() => import("./pages/ActivityPlanPage"));
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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
            <Route path="/text" element={<AuthGuard><UnifiedJournalPage /></AuthGuard>} />
            <Route path="/voice" element={<AuthGuard><UnifiedJournalPage /></AuthGuard>} />
            <Route path="/unified" element={<AuthGuard><UnifiedJournalPage /></AuthGuard>} />
            <Route path="/journal" element={<AuthGuard><JournalPage /></AuthGuard>} />
            <Route path="/breathe" element={<AuthGuard><BreathePage /></AuthGuard>} />
            <Route path="/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
            <Route path="/quiz" element={<AuthGuard><QuizPage /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
            <Route path="/counselors" element={<AuthGuard><CounselorSearchPage /></AuthGuard>} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/why-cbt" element={<AuthGuard><WhyCBTPage /></AuthGuard>} />
            <Route path="/thought-record" element={<AuthGuard><ThoughtRecordPage /></AuthGuard>} />
            <Route path="/activity-plan" element={<AuthGuard><ActivityPlanPage /></AuthGuard>} />
            <Route path="/handwriting" element={<Navigate to="/text" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </MobileLayout>
    </BrowserRouter>
  );
}
