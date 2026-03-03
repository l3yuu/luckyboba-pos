// src/utils/cache.ts

export function getCache<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    const { data, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
  } catch {
    // storage full or unavailable, fail silently
  }
}

export function clearCache(key: string) {
  sessionStorage.removeItem(key);
}