import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TextJournalPage from "./pages/TextJournalPage";
import VoicePage from "./pages/VoicePage";
import JournalPage from "./pages/JournalPage";
import QuizPage from "./pages/QuizPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

export default function Router() {
  console.log('Router component rendering');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text" element={<TextJournalPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}