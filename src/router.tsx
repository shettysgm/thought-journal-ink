import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import UnifiedJournalPage from "./pages/UnifiedJournalPage";
import JournalPage from "./pages/JournalPage";
import QuizPage from "./pages/QuizPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import WhyCBTPage from "./pages/WhyCBTPage";
import NotFound from "./pages/NotFound";
import MobileLayout from "./components/MobileLayout";

export default function Router() {
  console.log('Router component rendering');
  
  return (
    <BrowserRouter>
      <MobileLayout>
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
      </MobileLayout>
    </BrowserRouter>
  );
}