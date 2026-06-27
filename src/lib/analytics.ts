/**
 * Analytics wrapper — native-mobile only via Firebase Analytics for GA4.
 *
 * - On iOS/Android (Capacitor): uses @capacitor-firebase/analytics → GA4 (Firebase).
 * - On web: NO-OP. The published website does not send any analytics hits.
 * - Privacy-first: no personal text, journal content, or PII is ever sent.
 *   Events are coarse UX signals only (feature usage, milestones, numeric values).
 * - Consent-gated: nothing fires until the user opts in (Settings → "Anonymous usage analytics").
 */

import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

let enabled = false;
let initialized = false;
let cachedEntryCount = 0;

function isNative(): boolean {
  try {
    return !!Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function detectPlatform(): string {
  try {
    if (Capacitor?.isNativePlatform?.()) return Capacitor.getPlatform();
  } catch {}
  return 'web';
}

function detectTheme(): string {
  if (typeof document === 'undefined') return 'unknown';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function bucketEntries(n: number): string {
  if (n <= 0) return '0';
  if (n <= 5) return '1-5';
  if (n <= 20) return '6-20';
  if (n <= 50) return '21-50';
  return '50+';
}

async function safeCall(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    // Never let analytics crash the app.
    // eslint-disable-next-line no-console
    console.warn('[analytics] call failed:', err);
  }
}

export function isAnalyticsEnabled(): boolean {
  return enabled;
}

export function enableAnalytics() {
  if (enabled) return;
  enabled = true;

  if (!isNative()) {
    // Web build: deliberately no-op. We only track the native mobile app.
    return;
  }

  if (!initialized) {
    initialized = true;
    void safeCall(async () => {
      await FirebaseAnalytics.setEnabled({ enabled: true });
      await applyUserProperties();
      await FirebaseAnalytics.logEvent({
        name: 'app_open',
        params: { platform: detectPlatform() },
      });
    });
  } else {
    void safeCall(() => FirebaseAnalytics.setEnabled({ enabled: true }));
  }
}

export function disableAnalytics() {
  if (!enabled && !initialized) return;
  enabled = false;
  if (!isNative()) return;
  void safeCall(() => FirebaseAnalytics.setEnabled({ enabled: false }));
}

export function trackPageView(path: string, title?: string) {
  if (!enabled || !isNative()) return;
  void safeCall(() =>
    FirebaseAnalytics.logEvent({
      name: 'screen_view',
      params: {
        screen_name: title || path,
        screen_class: path,
      },
    }),
  );
}

export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
) {
  if (!enabled || !isNative()) return;
  void safeCall(() => FirebaseAnalytics.logEvent({ name, params }));
}

/** Track use of a discrete feature (CBT tool, breathing, sketch, etc.). */
export function trackFeature(
  feature: string,
  params: Record<string, string | number | boolean> = {},
) {
  trackEvent('feature_used', { feature, ...params });
}

export function setEntryCountForAnalytics(n: number) {
  cachedEntryCount = n;
  if (enabled && isNative()) void applyUserProperties();
}

async function applyUserProperties() {
  if (!isNative()) return;
  const props: Record<string, string> = {
    app_version: String((import.meta as any).env?.VITE_APP_VERSION || 'dev'),
    platform: detectPlatform(),
    theme: detectTheme(),
    entry_count_bucket: bucketEntries(cachedEntryCount),
    is_returning: cachedEntryCount > 0 ? 'true' : 'false',
  };
  for (const [key, value] of Object.entries(props)) {
    await safeCall(() => FirebaseAnalytics.setUserProperty({ key, value }));
  }
}

// Lifecycle events (native only)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!enabled || !isNative()) return;
    if (document.visibilityState === 'hidden') {
      trackEvent('app_background');
    } else if (document.visibilityState === 'visible') {
      trackEvent('app_foreground');
    }
  });
}
