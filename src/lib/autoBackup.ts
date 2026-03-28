import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { getAllJournalEntries, getAllDistortions } from '@/lib/idb';

const BACKUP_FILE = 'journal-inc-backup.json';
const BACKUP_DEBOUNCE_MS = 5000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Silently writes all journal entries + distortions as a JSON file
 * to the iOS Documents directory. This directory is:
 *   - Backed up to iCloud automatically
 *   - Visible in the Files app (with UIFileSharingEnabled)
 *   - Persists if user re-downloads the app from iCloud backup
 */
async function performBackup(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const entries = await getAllJournalEntries();
    const distortions = await getAllDistortions();

    // Strip Blobs (not JSON-serializable) — keep references only
    const cleanEntries = entries.map((e: any) => {
      const { drawingBlob, audioBlob, bannerBlob, ...rest } = e;
      return {
        ...rest,
        hasDrawingBlob: !!drawingBlob,
        hasAudioBlob: !!audioBlob,
        hasBannerBlob: !!bannerBlob,
      };
    });

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entriesCount: cleanEntries.length,
      entries: cleanEntries,
      distortions,
    };

    await Filesystem.writeFile({
      path: BACKUP_FILE,
      data: JSON.stringify(payload),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    console.log(`[AutoBackup] Saved ${cleanEntries.length} entries to Documents/${BACKUP_FILE}`);
  } catch (err) {
    // Silent fail — don't interrupt user flow
    console.warn('[AutoBackup] Failed:', err);
  }
}

/**
 * Schedule a debounced backup. Call after every save/update/delete.
 * Multiple rapid saves only trigger one write.
 */
export function scheduleAutoBackup(): void {
  if (!Capacitor.isNativePlatform()) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performBackup();
    debounceTimer = null;
  }, BACKUP_DEBOUNCE_MS);
}

/**
 * Try to restore entries from the Documents backup file.
 * Returns the parsed payload or null if no backup exists.
 */
export async function readBackupFile(): Promise<{
  version: number;
  exportedAt: string;
  entriesCount: number;
  entries: any[];
  distortions: any[];
} | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const result = await Filesystem.readFile({
      path: BACKUP_FILE,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    return JSON.parse(result.data as string);
  } catch {
    // File doesn't exist yet — that's fine
    return null;
  }
}
