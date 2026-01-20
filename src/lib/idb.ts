import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { JournalEntry, DistortionMeta, AppSettings } from '@/types';

interface CBTJournalDB extends DBSchema {
  journal_entries: {
    key: string;
    value: JournalEntry & {
      drawingBlob?: Blob;
      audioBlob?: Blob;
    };
  };
  distortion_meta: {
    key: string;
    value: DistortionMeta;
    indexes: { 'by-entry': string; 'by-type': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<CBTJournalDB>> | null = null;

export async function initDB(): Promise<IDBPDatabase<CBTJournalDB>> {
  // Always return the same promise to prevent multiple simultaneous opens
  if (!dbPromise) {
    dbPromise = openDB<CBTJournalDB>('cbt_journal_db', 1, {
      upgrade(database) {
        // Journal entries store
        if (!database.objectStoreNames.contains('journal_entries')) {
          database.createObjectStore('journal_entries', {
            keyPath: 'id',
          });
        }
        
        // Distortion metadata store with indexes
        if (!database.objectStoreNames.contains('distortion_meta')) {
          const metaStore = database.createObjectStore('distortion_meta', {
            keyPath: 'id',
          });
          metaStore.createIndex('by-entry', 'entryId');
          metaStore.createIndex('by-type', 'type');
          metaStore.createIndex('by-date', 'createdAt');
        }
        
        // Settings store
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', {
            keyPath: 'id',
          });
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked');
      },
      blocking() {
        console.warn('IndexedDB upgrade blocking');
      },
      terminated() {
        console.warn('IndexedDB connection terminated, will reconnect on next access');
        dbPromise = null;
      }
    });
  }
  
  return dbPromise;
}

// Journal entries CRUD
export async function saveJournalEntry(entry: JournalEntry & { drawingBlob?: Blob; audioBlob?: Blob }) {
  try {
    const database = await initDB();
    const tx = database.transaction('journal_entries', 'readwrite');
    await tx.store.put(entry);
    await tx.done; // Wait for transaction to complete
    console.log('Journal entry saved to IndexedDB:', entry.id);
  } catch (error) {
    // If database connection failed, reset and retry once
    console.warn('Database error, retrying:', error);
    dbPromise = null;
    const database = await initDB();
    const tx = database.transaction('journal_entries', 'readwrite');
    await tx.store.put(entry);
    await tx.done;
  }
}

export async function getJournalEntry(id: string) {
  const database = await initDB();
  return await database.get('journal_entries', id);
}

export async function getAllJournalEntries() {
  const database = await initDB();
  return await database.getAll('journal_entries');
}

export async function deleteJournalEntry(id: string) {
  const database = await initDB();
  await database.delete('journal_entries', id);
}

// Distortion metadata CRUD
export async function saveDistortionMeta(meta: DistortionMeta) {
  const database = await initDB();
  await database.put('distortion_meta', meta);
}

export async function getDistortionsByEntry(entryId: string) {
  const database = await initDB();
  return await database.getAllFromIndex('distortion_meta', 'by-entry', entryId);
}

export async function getDistortionsByType(type: string) {
  const database = await initDB();
  return await database.getAllFromIndex('distortion_meta', 'by-type', type);
}

export async function getAllDistortions() {
  const database = await initDB();
  return await database.getAll('distortion_meta');
}

export async function getDistortionsByDateRange(startDate: string, endDate: string) {
  const database = await initDB();
  const all = await database.getAll('distortion_meta');
  return all.filter(meta => meta.createdAt >= startDate && meta.createdAt <= endDate);
}

// Settings CRUD
export async function saveSettings(settings: AppSettings) {
  const database = await initDB();
  await database.put('settings', { ...settings, id: 'app_settings' } as any);
}

export async function getSettings(): Promise<AppSettings> {
  const database = await initDB();
  const settings = await database.get('settings', 'app_settings');
  return settings || {
    encryptionEnabled: false,
    autoDetectDistortions: true,
    syncStatsEnabled: false,
    aiAnalysisEnabled: true, // Default to enabled for new users
  };
}