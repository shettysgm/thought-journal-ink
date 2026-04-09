// Route AI calls through the Supabase Edge Function proxy
// This avoids CORS issues in native iOS/iPad WebView
const getBackendUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1`;
  }
  // Fallback to direct Vertex AI (works in browser, not in native WebView)
  return "https://vertexthought-755984933994.us-central1.run.app";
};

const getEndpoint = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return "/detect-distortions";
  }
  return "/api/generate";
};

export const API_CONFIG = {
  get BACKEND_URL() { return getBackendUrl(); },
  get DETECT_DISTORTIONS_ENDPOINT() { return getEndpoint(); }
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;
