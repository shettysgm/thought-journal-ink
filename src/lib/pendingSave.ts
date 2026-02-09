// Module-level promise to coordinate voice page saves with journal page loads.
// When VoicePage unmounts, it stores its save promise here.
// JournalPage awaits it before loading entries to avoid race conditions.

let pendingSavePromise: Promise<void> | null = null;

export function setPendingSave(promise: Promise<void>) {
  pendingSavePromise = promise;
}

export async function awaitPendingSave() {
  if (pendingSavePromise) {
    try {
      await pendingSavePromise;
    } catch (e) {
      console.warn('[pendingSave] Save promise rejected:', e);
    }
    pendingSavePromise = null;
  }
}
