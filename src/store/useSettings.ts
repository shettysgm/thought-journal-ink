import { create } from 'zustand';
import { AppSettings } from '@/types';
import { saveSettings, getSettings } from '@/lib/idb';
import { hashPassphrase } from '@/lib/crypto';

interface SettingsState extends AppSettings {
  currentPassphrase?: string; // Kept in memory only
  loading: boolean;
  error: string | null;
  unlocked: boolean; // In-memory lock state
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setPassphrase: (passphrase: string) => Promise<boolean>;
  clearPassphrase: () => void;
  verifyPassphrase: (passphrase: string) => Promise<boolean>;
  setAppLock: (password: string) => Promise<boolean>;
  removeAppLock: () => Promise<void>;
  verifyAppLock: (password: string) => Promise<boolean>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  encryptionEnabled: false,
  autoDetectDistortions: true,
  syncStatsEnabled: false,
  aiAnalysisEnabled: true,
  appLockEnabled: false,
  unlocked: false,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await getSettings();
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
      ...updates 
    };
    
    await saveSettings(newSettings);
    set(newSettings);
  },

  setPassphrase: async (passphrase: string) => {
    try {
      const hash = await hashPassphrase(passphrase);
      await get().updateSettings({ 
        encryptionEnabled: true, 
        passphraseHash: hash 
      });
      set({ currentPassphrase: passphrase });
      return true;
    } catch (error) {
      set({ error: 'Failed to set passphrase' });
      return false;
    }
  },

  clearPassphrase: () => {
    set({ currentPassphrase: undefined });
  },

  verifyPassphrase: async (passphrase: string) => {
    const current = get();
    if (!current.passphraseHash) return false;
    
    try {
      const hash = await hashPassphrase(passphrase);
      const isValid = hash === current.passphraseHash;
      if (isValid) set({ currentPassphrase: passphrase });
      return isValid;
    } catch (error) {
      return false;
    }
  },

  setAppLock: async (password: string) => {
    try {
      const hash = await hashPassphrase(password);
      await get().updateSettings({ appLockEnabled: true, appLockHash: hash });
      set({ unlocked: true });
      return true;
    } catch (error) {
      set({ error: 'Failed to set app lock' });
      return false;
    }
  },

  removeAppLock: async () => {
    await get().updateSettings({ appLockEnabled: false, appLockHash: undefined });
    set({ unlocked: false });
  },

  verifyAppLock: async (password: string) => {
    const current = get();
    if (!current.appLockHash) return false;
    try {
      const hash = await hashPassphrase(password);
      const isValid = hash === current.appLockHash;
      if (isValid) set({ unlocked: true });
      return isValid;
    } catch (error) {
      return false;
    }
  },
}));