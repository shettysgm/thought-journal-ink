// Data models for Journal IQ app

export type JournalEntry = {
  id: string;
  createdAt: string;           // ISO
  updatedAt?: string;          // ISO - last modified time
  text?: string;               // OCR or transcript (optional)
  hasDrawing?: boolean;
  hasAudio?: boolean;
  tags?: string[];
  stickers?: string[];         // emoji stickers
  blobPaths?: { drawing?: string; audio?: string }; // stored in IndexedDB as Blobs
  reframes?: Array<{           // AI-generated reframes
    span: string;
    suggestion: string;
    socratic: string;
  }>;
};

export type DistortionMeta = {
  id: string;
  entryId: string;
  createdAt: string;           // ISO
  type: string;                // e.g., "Mind Reading"
  phrase: string;              // short snippet only
};

export type AppSettings = {
  encryptionEnabled: boolean;
  autoDetectDistortions: boolean;
  syncStatsEnabled: boolean;
  passphraseHash?: string;
};

export type Hit = { 
  type: string; 
  phrase: string; 
  start: number;
  end: number;
  confidence?: number;
  rationale?: string;
  isAI?: boolean; // Distinguishes AI vs rule-based detection
};

export type DistortionType = {
  name: string;
  description: string;
  examples: string[];
  reframePrompts: string[];
};

export type QuizQuestion = {
  id: string;
  phrase: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
};

export type QuizResult = {
  score: number;
  total: number;
  completedAt: string;
};