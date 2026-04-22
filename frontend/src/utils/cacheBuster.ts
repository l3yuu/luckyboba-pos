/**
 * cacheBuster.ts — Clears all browser caches when a new build is deployed.
 *
 * On every production build, Vite injects a unique __BUILD_VERSION__ timestamp.
 * When the app starts, this module compares the build version with what's stored
 * in localStorage. If they differ (= new deployment), it:
 *   1. Clears all Service Worker caches (Workbox runtime caches)
 *   2. Unregisters the old Service Worker so the new one takes over
 *   3. Removes stale localStorage keys (dashboard stats, sequence caches, etc.)
 *   4. Stores the new version so this only runs once per deployment
 */

declare const __BUILD_VERSION__: string;

const VERSION_KEY = 'lucky_boba_build_version';

// Keys that should survive a deployment (auth credentials)
const PRESERVED_KEYS = [
  'lucky_boba_token',
  'lucky_boba_authenticated',
  'lucky_boba_user_role',
  'kiosk_branch_id',
  'kiosk_expo_mode',
  'kiosk_expo_items',
];

export async function bustCacheOnNewDeploy(): Promise<boolean> {
  const currentVersion = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'dev';
  const storedVersion = localStorage.getItem(VERSION_KEY);

  // Same version — no action needed
  if (storedVersion === currentVersion) return false;

  console.log(`[CacheBuster] New build detected: ${storedVersion ?? 'none'} → ${currentVersion}`);

  // 1. Clear all Service Worker caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`[CacheBuster] Cleared ${cacheNames.length} SW cache(s):`, cacheNames);
    } catch (e) {
      console.warn('[CacheBuster] Failed to clear SW caches:', e);
    }
  }

  // 2. Unregister old Service Workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      console.log(`[CacheBuster] Unregistered ${registrations.length} Service Worker(s)`);
    } catch (e) {
      console.warn('[CacheBuster] Failed to unregister SW:', e);
    }
  }

  // 3. Clear stale localStorage (preserve auth-related keys)
  const preserved: Record<string, string | null> = {};
  for (const key of PRESERVED_KEYS) {
    preserved[key] = localStorage.getItem(key);
  }

  localStorage.clear();

  // Restore preserved keys
  for (const [key, value] of Object.entries(preserved)) {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  }

  // 4. Clear sessionStorage too (kiosk unlock states etc.)
  sessionStorage.clear();

  // 5. Store the new version
  localStorage.setItem(VERSION_KEY, currentVersion);

  console.log('[CacheBuster] All caches cleared. Fresh start.');
  return true;
}
