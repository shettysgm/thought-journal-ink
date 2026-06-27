import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Capacitor — web (no-op) and native (Firebase) modes are tested separately.
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

const logEvent = vi.fn().mockResolvedValue(undefined);
const setEnabled = vi.fn().mockResolvedValue(undefined);
const setUserProperty = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor-firebase/analytics', () => ({
  FirebaseAnalytics: {
    logEvent: (...args: unknown[]) => logEvent(...args),
    setEnabled: (...args: unknown[]) => setEnabled(...args),
    setUserProperty: (...args: unknown[]) => setUserProperty(...args),
  },
}));

async function loadFresh() {
  vi.resetModules();
  logEvent.mockClear();
  setEnabled.mockClear();
  setUserProperty.mockClear();
  return await import('@/lib/analytics');
}

describe('analytics (web build)', () => {
  beforeEach(() => {
    document.cookie = '';
  });

  it('is disabled by default and never calls Firebase on web', async () => {
    const a = await loadFresh();
    expect(a.isAnalyticsEnabled()).toBe(false);
    a.trackEvent('feature_used', { feature: 'breathing' });
    expect(logEvent).not.toHaveBeenCalled();
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('enableAnalytics on web is a no-op (no Firebase calls)', async () => {
    const a = await loadFresh();
    a.enableAnalytics();
    expect(a.isAnalyticsEnabled()).toBe(true);
    a.trackEvent('quiz_completed', { score: 4, total: 5 });
    a.trackFeature('breathing', { duration: 60 });
    a.trackPageView('/home', 'Home');
    a.setEntryCountForAnalytics(10);
    expect(logEvent).not.toHaveBeenCalled();
    expect(setEnabled).not.toHaveBeenCalled();
    expect(setUserProperty).not.toHaveBeenCalled();
  });

  it('disableAnalytics on web flips the flag without Firebase calls', async () => {
    const a = await loadFresh();
    a.enableAnalytics();
    a.disableAnalytics();
    expect(a.isAnalyticsEnabled()).toBe(false);
    expect(setEnabled).not.toHaveBeenCalled();
  });
});
