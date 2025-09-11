export const API_CONFIG = {
  BACKEND_URL: "https://vertex-gemini-content-creator-755984933994.us-central1.run.app",
  DETECT_DISTORTIONS_ENDPOINT: "/api/detectDistortions"
} as const;

export const getDetectDistortionsUrl = () => 
  `${API_CONFIG.BACKEND_URL}${API_CONFIG.DETECT_DISTORTIONS_ENDPOINT}`;