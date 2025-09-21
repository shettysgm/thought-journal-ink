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
import { format } from 'date-fns';

interface EntriesState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  findTodaysEntries: () => JournalEntry[];
  createEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'> & { drawingBlob?: Blob; audioBlob?: Blob }) => Promise<string>;
  appendToEntry: (existingId: string, newData: Partial<JournalEntry> & { drawingBlob?: Blob; audioBlob?: Blob }) => Promise<string>;
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
      
      console.log('Loaded entries from IndexedDB:', decryptedEntries);
      set({ entries: decryptedEntries, loading: false });
    } catch (error) {
      set({ error: 'Failed to load entries', loading: false });
    }
  },

  findTodaysEntries: () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return get().entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    });
  },

  appendToEntry: async (existingId: string, newData: Partial<JournalEntry> & { drawingBlob?: Blob; audioBlob?: Blob }) => {
    const existingEntry = await getJournalEntry(existingId);
    if (!existingEntry) throw new Error('Entry not found');
    
    const settings = useSettings.getState();
    
    // Combine text content
    let combinedText = existingEntry.text || '';
    if (newData.text) {
      combinedText = combinedText ? `${combinedText}\n\n--- Added ${format(new Date(), 'h:mm a')} ---\n${newData.text}` : newData.text;
    }
    
    // Encrypt combined text if needed
    if (settings.encryptionEnabled && settings.currentPassphrase && combinedText) {
      combinedText = await encryptText(combinedText, settings.currentPassphrase);
    }
    
    // Merge entry properties
    const updatedEntry = {
      ...existingEntry,
      text: combinedText,
      hasAudio: existingEntry.hasAudio || newData.hasAudio || false,
      hasDrawing: existingEntry.hasDrawing || newData.hasDrawing || false,
      drawingBlob: newData.drawingBlob ?? (existingEntry as any).drawingBlob,
      audioBlob: newData.audioBlob ?? (existingEntry as any).audioBlob,
      tags: [...new Set([...(existingEntry.tags || []), ...(newData.tags || [])])],
    };
    
    await saveJournalEntry(updatedEntry);
    
    // Update local state
    set(state => ({
      entries: state.entries.map(entry => 
        entry.id === existingId ? { ...updatedEntry, text: settings.encryptionEnabled ? 
          (existingEntry.text || '') + (newData.text ? `\n\n--- Added ${format(new Date(), 'h:mm a')} ---\n${newData.text}` : '') : 
          combinedText 
        } : entry
      )
    }));
    
    return existingId;
  },

  createEntry: async (entryData) => {
    console.log('Creating entry with data:', entryData);
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
    console.log('Entry saved to IndexedDB:', entry);
    
    // Process distortions if auto-detect is enabled and we have text
    if (settings.autoDetectDistortions && entryData.text) {
      const { analyzeEntryWithContext } = await import('@/lib/hybridDetection');
      const { useDistortions } = await import('./useDistortions');
      const { addDistortion } = useDistortions.getState();
      
      try {
        // Use hybrid detection (AI + rules) with context awareness
        await analyzeEntryWithContext(
          id, 
          entryData.text, 
          'hybrid',
          async (distortionData) => {
            await addDistortion(distortionData);
          }
        );
      } catch (error) {
        console.warn('Distortion analysis failed:', error);
        // Fallback to rule-based detection only
        const { detectDistortions } = await import('@/lib/distortions');
        const hits = detectDistortions(entryData.text);
        
        for (const hit of hits) {
          await addDistortion({
            entryId: id,
            createdAt,
            type: hit.type,
            phrase: hit.phrase,
          });
        }
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