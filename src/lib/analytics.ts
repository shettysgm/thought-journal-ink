/**
 * Google Analytics 4 wrapper — privacy-first, consent-gated.
 *
 * - GA4 script is loaded ONLY after the user opts in (Settings → "Anonymous usage analytics").
 * - No personal text, journal content, or PII is ever sent.
 * - Events are restricted to coarse-grained UX signals: page views, feature usage counts,
 *   gamification milestones. Numeric values only (word counts, streak length, level).
 * - Disabling the toggle stops further events and removes the GA cookies.
 */

import { Capacitor } from '@capacitor/core';


const GA_MEASUREMENT_ID = 'G-SEFR8M90X1';
const SCRIPT_ID = 'ga4-gtag-script';

type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFn;
  }
}

let initialized = false;
let enabled = false;

function injectScript() {
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

function removeGaCookies() {
  // GA cookies start with _ga; clear them on the current host.
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name.startsWith('_ga')) {
      const domain = location.hostname;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

export function isAnalyticsEnabled(): boolean {
  return enabled;
}

export function enableAnalytics() {
  if (enabled) return;
  enabled = true;

  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  const currentTitle = document.title;

  if (!initialized) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    } as GtagFn;
    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'granted' });
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: false, // we send these manually via trackPageView
    });
    applyUserProperties();
    window.gtag('event', 'page_view', {
      page_path: currentPath,
      page_title: currentTitle,
      page_location: window.location.href,
    });
    injectScript();
    initialized = true;

  } else {
    // Re-enable measurement after a previous opt-out
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    window.gtag?.('event', 'page_view', {
      page_path: currentPath,
      page_title: currentTitle,
      page_location: window.location.href,
    });
  }
}

export function disableAnalytics() {
  if (!enabled && !initialized) return;
  enabled = false;
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
  removeGaCookies();
}

export function trackPageView(path: string, title?: string) {
  if (!enabled || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.origin + path,
  });
}

export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!enabled || !window.gtag) return;
  window.gtag('event', name, params);
}

/** Track use of a discrete feature (CBT tool, breathing, sketch, etc.). */
export function trackFeature(feature: string, params: Record<string, string | number | boolean> = {}) {
  trackEvent('feature_used', { feature, ...params });
}

function bucketEntries(n: number): string {
  if (n <= 0) return '0';
  if (n <= 5) return '1-5';
  if (n <= 20) return '6-20';
  if (n <= 50) return '21-50';
  return '50+';
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

let cachedEntryCount = 0;
export function setEntryCountForAnalytics(n: number) {
  cachedEntryCount = n;
  if (enabled && window.gtag) applyUserProperties();
}

function applyUserProperties() {
  if (!window.gtag) return;
  window.gtag('set', 'user_properties', {
    app_version: (import.meta as any).env?.VITE_APP_VERSION || 'dev',
    platform: detectPlatform(),
    theme: detectTheme(),
    entry_count_bucket: bucketEntries(cachedEntryCount),
    is_returning: cachedEntryCount > 0,
  });
}

// Lifecycle events
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!enabled || !window.gtag) return;
    if (document.visibilityState === 'hidden') {
      trackEvent('app_background');
    } else if (document.visibilityState === 'visible') {
      trackEvent('app_foreground');
    }
  });
}

