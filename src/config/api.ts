// Access runtime environment variables injected by Docker container
const getBackendUrl = () => {
  // Prefer runtime-injected window.ENV
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_BACKEND_URL) {
    return (window as any).ENV.VITE_BACKEND_URL;
  }
  // Also allow build-time Vite envs when available (dev)
  // Note: These may not be set in Lovable preview, but won't hurt.
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) {
    // @ts-ignore
    return (import.meta as any).env.VITE_BACKEND_URL as string;
  }
  // Fallback for development
  return "https://vertex-gemini-content-creator-755984933994.us-central1.run.app";
};

const getEndpoint = () => {
  // Allow optional override via env; default to API path used by backend
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_DETECT_ENDPOINT !== undefined) {
    return (window as any).ENV.VITE_DETECT_ENDPOINT || "/api/detectDistortions";
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DETECT_ENDPOINT !== undefined) {
    // @ts-ignore
    return (import.meta as any).env.VITE_DETECT_ENDPOINT || "/api/detectDistortions";
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
