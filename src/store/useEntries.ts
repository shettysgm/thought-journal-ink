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
    
    console.log('Saving entry to IndexedDB...');
    await saveJournalEntry(entry);
    console.log('Entry saved to IndexedDB:', entry);
    
    // Add to local state first (with decrypted text for display)
    const displayEntry = { ...entry };
    if (settings.encryptionEnabled && entryData.text) {
      displayEntry.text = entryData.text; // Keep original text for display
    }
    
    set(state => ({ 
      entries: [...state.entries, displayEntry].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));
    
    // Process distortions asynchronously (don't block entry creation)
    if (settings.autoDetectDistortions && entryData.text) {
      console.log('Starting distortion analysis...');
      // Run distortion analysis in the background without blocking
      setTimeout(async () => {
        const { analyzeEntryWithContext } = await import('@/lib/hybridDetection');
        const { useDistortions } = await import('./useDistortions');
        const { addDistortion } = useDistortions.getState();
        
        try {
          console.log('Running hybrid distortion detection...');
          const { hits, reframes } = await analyzeEntryWithContext(
            id, 
            entryData.text, 
            'ai-only',
            async (distortionData) => {
              await addDistortion(distortionData);
            }
          );
          console.log('[useEntries] Distortion analysis completed, reframes:', JSON.stringify(reframes));
          
          // Store reframes with the entry
          if (reframes && reframes.length > 0) {
            console.log('[useEntries] Saving reframes to entry:', id);
            await get().updateEntry(id, { reframes });
            console.log('[useEntries] Reframes saved successfully');
          } else {
            console.log('[useEntries] No reframes to save');
          }
        } catch (error) {
          console.warn('Distortion analysis failed, using fallback:', error);
          // Fallback to rule-based detection only
          try {
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
            console.log('Fallback rule-based detection completed');
          } catch (fallbackError) {
            console.error('Even fallback detection failed:', fallbackError);
          }
        }
      }, 100); // Small delay to ensure entry creation completes first
    }
    
    console.log('Entry creation completed, returning ID:', id);
    return id;
  },

  updateEntry: async (id, updates) => {
    const existingEntry = await getJournalEntry(id);
    if (!existingEntry) return;

    const settings = useSettings.getState();

    // Only update stored text if a new text value is provided.
    // This prevents wiping text when updating metadata (e.g., reframes).
    const hasTextUpdate = typeof updates.text === 'string';

    let storedText = existingEntry.text;
    if (hasTextUpdate) {
      storedText = updates.text;
      if (settings.encryptionEnabled && settings.currentPassphrase && storedText) {
        storedText = await encryptText(storedText, settings.currentPassphrase);
      }
    }

    const updatedEntry = {
      ...existingEntry,
      ...updates,
      ...(hasTextUpdate ? { text: storedText } : {}),
      updatedAt: new Date().toISOString(), // Track last update time
    };

    await saveJournalEntry(updatedEntry);

    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? {
              ...updatedEntry,
              // Keep plaintext text in memory for display when available
              text: hasTextUpdate ? (updates.text as string) : entry.text,
            }
          : entry
      ),
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