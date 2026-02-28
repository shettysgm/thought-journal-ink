import { create } from 'zustand';
import { AppSettings } from '@/types';
import { saveSettings, getSettings } from '@/lib/idb';
import { hashPassphrase } from '@/lib/crypto';

const RESET_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;

interface SettingsState extends AppSettings {
  currentPassphrase?: string;
  loading: boolean;
  error: string | null;
  unlocked: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setPassphrase: (passphrase: string) => Promise<boolean>;
  clearPassphrase: () => void;
  verifyPassphrase: (passphrase: string) => Promise<boolean>;
  setAppLock: (pin: string) => Promise<boolean>;
  removeAppLock: () => Promise<void>;
  verifyAppLock: (pin: string) => Promise<boolean>;
  requestReset: () => Promise<void>;
  checkResetComplete: () => Promise<boolean>;
  getResetRemainingMs: () => number;
}

export const useSettings = create<SettingsState>((set, get) => ({
  encryptionEnabled: false,
  autoDetectDistortions: true,
  syncStatsEnabled: false,
  aiAnalysisEnabled: true,
  appLockEnabled: false,
  failedAttempts: 0,
  unlocked: false,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await getSettings();
      // Auto-check if a pending reset has completed
      if (settings.resetRequestedAt) {
        const elapsed = Date.now() - new Date(settings.resetRequestedAt).getTime();
        if (elapsed >= RESET_DELAY_MS) {
          // Reset complete — clear lock
          const updated = { ...settings, appLockEnabled: false, appLockHash: undefined, resetRequestedAt: undefined, failedAttempts: 0 };
          await saveSettings(updated);
          set({ ...updated, loading: false, unlocked: false });
          return;
        }
      }
      set({ ...settings, loading: false });
    } catch (error) {
      set({ error: 'Failed to load settings', loading: false });
    }
  },

  updateSettings: async (updates) => {
    const current = get();
    const newSettings: AppSettings = {
      encryptionEnabled: current.encryptionEnabled,
      autoDetectDistortions: current.autoDetectDistortions,
      syncStatsEnabled: current.syncStatsEnabled,
      aiAnalysisEnabled: current.aiAnalysisEnabled,
      appLockEnabled: current.appLockEnabled,
      passphraseHash: current.passphraseHash,
      appLockHash: current.appLockHash,
      resetRequestedAt: current.resetRequestedAt,
      failedAttempts: current.failedAttempts,
      feedbackCount: current.feedbackCount,
      lastFeedbackAt: current.lastFeedbackAt,
      ...updates,
    };
    await saveSettings(newSettings);
    set(newSettings);
  },

  setPassphrase: async (passphrase: string) => {
    try {
      const hash = await hashPassphrase(passphrase);
      await get().updateSettings({ encryptionEnabled: true, passphraseHash: hash });
      set({ currentPassphrase: passphrase });
      return true;
    } catch {
      set({ error: 'Failed to set passphrase' });
      return false;
    }
  },

  clearPassphrase: () => set({ currentPassphrase: undefined }),

  verifyPassphrase: async (passphrase: string) => {
    const current = get();
    if (!current.passphraseHash) return false;
    try {
      const hash = await hashPassphrase(passphrase);
      const isValid = hash === current.passphraseHash;
      if (isValid) set({ currentPassphrase: passphrase });
      return isValid;
    } catch {
      return false;
    }
  },

  setAppLock: async (pin: string) => {
    try {
      const hash = await hashPassphrase(pin);
      await get().updateSettings({ appLockEnabled: true, appLockHash: hash, failedAttempts: 0, resetRequestedAt: undefined });
      set({ unlocked: true });
      return true;
    } catch {
      set({ error: 'Failed to set app lock' });
      return false;
    }
  },

  removeAppLock: async () => {
    await get().updateSettings({ appLockEnabled: false, appLockHash: undefined, resetRequestedAt: undefined, failedAttempts: 0 });
    set({ unlocked: false });
  },

  verifyAppLock: async (pin: string) => {
    const current = get();
    if (!current.appLockHash) return false;
    // If reset is pending, reject all attempts
    if (current.resetRequestedAt) return false;
    try {
      const hash = await hashPassphrase(pin);
      const isValid = hash === current.appLockHash;
      if (isValid) {
        await get().updateSettings({ failedAttempts: 0 });
        set({ unlocked: true });
      } else {
        const newCount = (current.failedAttempts || 0) + 1;
        await get().updateSettings({ failedAttempts: newCount });
        // Auto-trigger reset after max attempts
        if (newCount >= MAX_FAILED_ATTEMPTS) {
          await get().requestReset();
        }
      }
      return isValid;
    } catch {
      return false;
    }
  },

  requestReset: async () => {
    const now = new Date().toISOString();
    await get().updateSettings({ resetRequestedAt: now });
  },

  checkResetComplete: async () => {
    const current = get();
    if (!current.resetRequestedAt) return false;
    const elapsed = Date.now() - new Date(current.resetRequestedAt).getTime();
    if (elapsed >= RESET_DELAY_MS) {
      await get().updateSettings({ appLockEnabled: false, appLockHash: undefined, resetRequestedAt: undefined, failedAttempts: 0 });
      set({ unlocked: false });
      return true;
    }
    return false;
  },

  getResetRemainingMs: () => {
    const current = get();
    if (!current.resetRequestedAt) return 0;
    const elapsed = Date.now() - new Date(current.resetRequestedAt).getTime();
    return Math.max(0, RESET_DELAY_MS - elapsed);
  },
}));
