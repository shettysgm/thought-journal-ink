import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Capacitor so detectPlatform() returns "web" predictably
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

async function loadFresh() {
  vi.resetModules();
  // Reset DOM state used by the module
  document.head.innerHTML = '';
  delete (window as unknown as Record<string, unknown>).gtag;
  delete (window as unknown as Record<string, unknown>).dataLayer;
  return await import('@/lib/analytics');

}

describe('analytics', () => {
  beforeEach(() => {
    document.cookie = '';
  });

  it('is disabled by default and does not inject the GA script', async () => {
    const a = await loadFresh();
    expect(a.isAnalyticsEnabled()).toBe(false);
    expect(document.getElementById('ga4-gtag-script')).toBeNull();
    // Calling trackEvent before enable must be a no-op
    a.trackEvent('feature_used', { feature: 'breathing' });
    expect((window as any).dataLayer).toBeUndefined();
  });

  it('initializes gtag, pushes consent + page_view, and injects the script when enabled', async () => {
    const a = await loadFresh();
    a.enableAnalytics();

    expect(a.isAnalyticsEnabled()).toBe(true);
    expect(typeof (window as any).gtag).toBe('function');
    expect(document.getElementById('ga4-gtag-script')).not.toBeNull();

    const dl = (window as any).dataLayer as IArguments[];
    expect(Array.isArray(dl)).toBe(true);

    // dataLayer entries are `arguments` objects — flatten for inspection.
    const flat = dl.map((args) => Array.from(args));
    const hasConsent = flat.some(
      (a) => a[0] === 'consent' && a[1] === 'default'
    );
    const hasConfig = flat.some(
      (a) => a[0] === 'config' && a[1] === 'G-SEFR8M90X1'
    );
    const hasPageView = flat.some(
      (a) => a[0] === 'event' && a[1] === 'page_view'
    );
    const hasUserProps = flat.some(
      (a) => a[0] === 'set' && a[1] === 'user_properties'
    );

    expect(hasConsent).toBe(true);
    expect(hasConfig).toBe(true);
    expect(hasPageView).toBe(true);
    expect(hasUserProps).toBe(true);
  });

  it('trackEvent and trackFeature push event payloads after enable', async () => {
    const a = await loadFresh();
    a.enableAnalytics();

    a.trackEvent('quiz_completed', { score: 4, total: 5 });
    a.trackFeature('breathing', { duration: 60 });

    const flat = ((window as any).dataLayer as IArguments[]).map((args) =>
      Array.from(args)
    );

    const quiz = flat.find(
      (e) => e[0] === 'event' && e[1] === 'quiz_completed'
    );
    expect(quiz).toBeTruthy();
    expect(quiz?.[2]).toMatchObject({ score: 4, total: 5 });

    const feat = flat.find(
      (e) =>
        e[0] === 'event' &&
        e[1] === 'feature_used' &&
        (e[2] as any)?.feature === 'breathing'
    );
    expect(feat).toBeTruthy();
    expect(feat?.[2]).toMatchObject({ feature: 'breathing', duration: 60 });
  });

  it('disableAnalytics flips consent to denied and clears _ga cookies', async () => {
    const a = await loadFresh();
    a.enableAnalytics();

    // Simulate a GA cookie being set
    document.cookie = '_ga=GA1.test; path=/';
    expect(document.cookie).toContain('_ga=');

    a.disableAnalytics();
    expect(a.isAnalyticsEnabled()).toBe(false);

    const flat = ((window as any).dataLayer as IArguments[]).map((args) =>
      Array.from(args)
    );
    const deniedUpdate = flat.find(
      (e) =>
        e[0] === 'consent' &&
        e[1] === 'update' &&
        (e[2] as any)?.analytics_storage === 'denied'
    );
    expect(deniedUpdate).toBeTruthy();
    expect(document.cookie).not.toContain('_ga=GA1.test');
  });

  it('setEntryCountForAnalytics updates user_properties when enabled', async () => {
    const a = await loadFresh();
    a.enableAnalytics();
    a.setEntryCountForAnalytics(10);

    const flat = ((window as any).dataLayer as IArguments[]).map((args) =>
      Array.from(args)
    );
    const userProps = flat.filter(
      (e) => e[0] === 'set' && e[1] === 'user_properties'
    );
    expect(userProps.length).toBeGreaterThanOrEqual(2);

    const last = userProps[userProps.length - 1][2] as Record<string, unknown>;
    expect(last.entry_count_bucket).toBe('6-20');
    expect(last.is_returning).toBe(true);
    expect(last.platform).toBe('web');
  });
});
