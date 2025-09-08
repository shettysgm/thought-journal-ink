import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HandwritingPage from "./pages/HandwritingPage";
import VoicePage from "./pages/VoicePage";
import InsightsPage from "./pages/InsightsPage";
import QuizPage from "./pages/QuizPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/handwriting" element={<HandwritingPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}