// Use relative API routes for Vercel deployment
const getBackendUrl = () => {
  // For Vercel deployment, use relative paths to API routes
  return "";
};

export const API_CONFIG = {
  get BACKEND_URL() { return getBackendUrl(); },
  DETECT_DISTORTIONS_ENDPOINT: "/api/detectDistortions" 
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;