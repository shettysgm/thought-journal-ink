// Detects iPads, Android tablets, and desktop/laptop devices.
// Returns false for phones (small screens with coarse-only pointers).
export function isTabletOrLarger(): boolean {
  if (typeof window === 'undefined') return true;

  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';
  const maxTouch = (navigator as any).maxTouchPoints || 0;

  // Modern iPadOS reports as Mac — detect via touch points.
  const isIPadOS = platform === 'MacIntel' && maxTouch > 1;
  const isIPad = /iPad/i.test(ua) || isIPadOS;
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);

  if (isIPad || isAndroidTablet) return true;

  // Phones: explicit mobile UA AND small viewport
  const isMobileUA = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  if (isMobileUA) return false;

  // Desktop/laptop: fine pointer (mouse/trackpad) — allow.
  if (window.matchMedia?.('(pointer: fine)').matches) return true;

  // Fallback: large viewport + any pointer.
  return window.innerWidth >= 768;
}

export function isPhone(): boolean {
  return !isTabletOrLarger();
}
