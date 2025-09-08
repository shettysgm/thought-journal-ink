import { create } from 'zustand';
import { JournalEntry } from '@/types';
import { 
  saveJournalEntry, 
  getJournalEntry, 
  getAllJournalEntries, 
  deleteJournalEntry 
} from '@/lib/idb';
import { encryptText, decryptText } from '@/lib/crypto';
import { useSettings } from './useSettings';

interface EntriesState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  createEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'> & { drawingBlob?: Blob; audioBlob?: Blob }) => Promise<string>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => Promise<JournalEntry | undefined>;
}

export const useEntries = create<EntriesState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  loadEntries: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await getAllJournalEntries();
      
      // Decrypt entries if encryption is enabled
      const settings = useSettings.getState();
      const decryptedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (settings.encryptionEnabled && settings.currentPassphrase && entry.text) {
            try {
              entry.text = await decryptText(entry.text, settings.currentPassphrase);
            } catch (error) {
              console.warn('Failed to decrypt entry:', entry.id);
            }
          }
          return entry;
        })
      );
      
      set({ entries: decryptedEntries, loading: false });
    } catch (error) {
      set({ error: 'Failed to load entries', loading: false });
    }
  },

  createEntry: async (entryData) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    let text = entryData.text;
    
    // Encrypt text if encryption is enabled
    const settings = useSettings.getState();
    if (settings.encryptionEnabled && settings.currentPassphrase && text) {
      text = await encryptText(text, settings.currentPassphrase);
    }
    
    const entry: JournalEntry & { drawingBlob?: Blob; audioBlob?: Blob } = {
      id,
      createdAt,
      ...entryData,
      text,
    };
    
    await saveJournalEntry(entry);
    
    // Process distortions if auto-detect is enabled and we have text
    if (settings.autoDetectDistortions && entryData.text) {
      const { detectDistortions } = await import('@/lib/distortions');
      const { useDistortions } = await import('./useDistortions');
      
      const hits = detectDistortions(entryData.text);
      const { addDistortion } = useDistortions.getState();
      
      // Save each distortion hit
      for (const hit of hits) {
        await addDistortion({
          entryId: id,
          createdAt,
          type: hit.type,
          phrase: hit.phrase,
        });
      }
    }
    
    // Add to local state (with decrypted text for display)
    const displayEntry = { ...entry };
    if (settings.encryptionEnabled && entryData.text) {
      displayEntry.text = entryData.text; // Keep original text for display
    }
    
    set(state => ({ 
      entries: [...state.entries, displayEntry].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));
    
    return id;
  },

  updateEntry: async (id, updates) => {
    const existingEntry = await getJournalEntry(id);
    if (!existingEntry) return;
    
    // Encrypt text if needed
    let updatedText = updates.text;
    const settings = useSettings.getState();
    if (settings.encryptionEnabled && settings.currentPassphrase && updatedText) {
      updatedText = await encryptText(updatedText, settings.currentPassphrase);
    }
    
    const updatedEntry = { 
      ...existingEntry, 
      ...updates, 
      text: updatedText 
    };
    
    await saveJournalEntry(updatedEntry);
    
    set(state => ({
      entries: state.entries.map(entry => 
        entry.id === id ? { ...updatedEntry, text: updates.text || entry.text } : entry
      )
    }));
  },

  deleteEntry: async (id) => {
    await deleteJournalEntry(id);
    set(state => ({
      entries: state.entries.filter(entry => entry.id !== id)
    }));
  },

  getEntry: async (id) => {
    const entry = await getJournalEntry(id);
    if (!entry) return undefined;
    
    // Decrypt if needed
    const settings = useSettings.getState();
    if (settings.encryptionEnabled && settings.currentPassphrase && entry.text) {
      try {
        entry.text = await decryptText(entry.text, settings.currentPassphrase);
      } catch (error) {
        console.warn('Failed to decrypt entry:', id);
      }
    }
    
    return entry;
  },
}));