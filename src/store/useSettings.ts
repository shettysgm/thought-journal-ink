import { create } from 'zustand';
import { AppSettings } from '@/types';
import { saveSettings, getSettings } from '@/lib/idb';
import { hashPassphrase } from '@/lib/crypto';

interface SettingsState extends AppSettings {
  currentPassphrase?: string; // Kept in memory only
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setPassphrase: (passphrase: string) => Promise<boolean>;
  clearPassphrase: () => void;
  verifyPassphrase: (passphrase: string) => Promise<boolean>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  encryptionEnabled: false,
  autoDetectDistortions: true,
  syncStatsEnabled: false,
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
    const newSettings = { 
      encryptionEnabled: current.encryptionEnabled,
      autoDetectDistortions: current.autoDetectDistortions,
      syncStatsEnabled: current.syncStatsEnabled,
      passphraseHash: current.passphraseHash,
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
      
      if (isValid) {
        set({ currentPassphrase: passphrase });
      }
      
      return isValid;
    } catch (error) {
      return false;
    }
  },
}));