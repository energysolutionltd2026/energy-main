// Simple in-process cache for server-side use in API routes.
// NOTE: This cache is per Node.js process. If you run multiple
// instances, each has its own cache.

export interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

const store = new Map<string, CacheEntry<unknown>>();

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  const expiresAt = Date.now() + ttlMs;
  store.set(key, { value, expiresAt });
}

export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function deleteCache(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
