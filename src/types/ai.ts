// AI-specific types for distortion detection

export type AIDetectionResult = {
  type: string;
  span: string;
  rationale: string;
  confidence: number;
};

export type AIReframe = {
  span: string;
  suggestion: string;
  socratic: string;
};

export type AIResponse = {
  distortions: AIDetectionResult[];
  reframes: AIReframe[];
};

export type ContextualHit = {
  type: string;
  phrase: string;
  start: number;
  end: number;
  confidence?: number;
  rationale?: string;
  isAI?: boolean; // Distinguishes AI vs rule-based detection
};