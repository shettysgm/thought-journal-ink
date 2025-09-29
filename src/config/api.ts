// Access runtime environment variables injected by Docker container
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_BACKEND_URL) {
    return (window as any).ENV.VITE_BACKEND_URL;
  }
  // Fallback for development
  return "https://vertex-gemini-content-creator-755984933994.us-central1.run.app";
};

const getEndpoint = () => {
  // Allow optional override via env; default to API path used by backend
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_DETECT_ENDPOINT !== undefined) {
    return (window as any).ENV.VITE_DETECT_ENDPOINT || "/api/detectDistortions";
  }
  // Fallback to the default endpoint path
  return "/api/detectDistortions";
};

export const API_CONFIG = {
  get BACKEND_URL() { return getBackendUrl(); },
  get DETECT_DISTORTIONS_ENDPOINT() { return getEndpoint(); }
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;
