// Access runtime environment variables injected by Docker container
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_BACKEND_URL) {
    return (window as any).ENV.VITE_BACKEND_URL;
  }
  // Fallback for development
  return "https://vertex-gemini-content-creator-755984933994.us-central1.run.app";
};

export const API_CONFIG = {
  get BACKEND_URL() { return getBackendUrl(); },
  DETECT_DISTORTIONS_ENDPOINT: "" 
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;