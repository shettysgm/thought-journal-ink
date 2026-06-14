/**
 * Native in-app review prompt.
 * - Asks the user to rate the app on iOS App Store / Google Play.
 * - Triggered after the 3rd journal entry.
 * - Only ever requested once (persisted in localStorage).
 * - Silent no-op on web.
 */
import { Capacitor } from '@capacitor/core';

const REQUESTED_KEY = 'app-review-requested-at';
const TRIGGER_AFTER_ENTRIES = 3;

export async function maybeRequestReview(entryCount: number): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    if (entryCount < TRIGGER_AFTER_ENTRIES) return;
    if (localStorage.getItem(REQUESTED_KEY)) return;

    // Mark first so a crash/decline doesn't re-prompt
    localStorage.setItem(REQUESTED_KEY, new Date().toISOString());

    const mod = await import('@capacitor-community/in-app-review');
    await mod.InAppReview.requestReview();
  } catch (err) {
    console.warn('[AppReview] requestReview failed:', err);
  }
}
