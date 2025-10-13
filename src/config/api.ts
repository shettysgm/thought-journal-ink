// Use the exact backend URL specified
const getBackendUrl = () => {
  // Allow environment override if needed
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_BACKEND_URL) {
    return (window as any).ENV.VITE_BACKEND_URL;
  }
  // Use the exact URL specified
  return "https://vertex-gemini-content-creator-755984933994.us-central1.run.app";
};

const getEndpoint = () => {
  // Use the correct API endpoint path
  return "/api/generate";
};

export const API_CONFIG = {
  get BACKEND_URL() { return getBackendUrl(); },
  get DETECT_DISTORTIONS_ENDPOINT() { return getEndpoint(); }
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;

export const getOcrUrl = () => '/api/ocrHandwriting';
