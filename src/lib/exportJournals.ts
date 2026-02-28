import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllJournalEntries } from '@/lib/idb';
import { decryptText } from '@/lib/crypto';
import { useSettings } from '@/store/useSettings';
import { format } from 'date-fns';

export async function exportJournalsToFile(): Promise<void> {
  // Load all entries
  const entries = await getAllJournalEntries();
  const settings = useSettings.getState();

  // Decrypt entries if needed
  const decryptedEntries = await Promise.all(
    entries.map(async (entry) => {
      const e = { ...entry };
      if (settings.encryptionEnabled && settings.currentPassphrase && e.text) {
        try {
          e.text = await decryptText(e.text, settings.currentPassphrase);
        } catch {
          e.text = '[encrypted — could not decrypt]';
        }
      }
      // Strip blob paths (not serialisable)
      delete (e as any).drawingBlob;
      delete (e as any).audioBlob;
      return e;
    })
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    entryCount: decryptedEntries.length,
    entries: decryptedEntries,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = `journal-export-${format(new Date(), 'yyyy-MM-dd')}.json`;

  // Native path: write to cache then share via share sheet (→ Save to Files / iCloud)
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: 'Journal Export',
      text: `${decryptedEntries.length} journal entries`,
      url: result.uri,
      dialogTitle: 'Save your journal export',
    });
  } else {
    // Web fallback: trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
