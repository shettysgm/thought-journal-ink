import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import TextJournalPage from "./pages/TextJournalPage";
import VoicePage from "./pages/VoicePage";
import JournalPage from "./pages/JournalPage";
import QuizPage from "./pages/QuizPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

export default function Router() {
  console.log('Router component rendering');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/text" replace />} />
        <Route path="/text" element={<TextJournalPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/handwriting" element={<Navigate to="/text" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}