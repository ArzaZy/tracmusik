// ============================================================
// TracMusic — MetadataCache
// In-memory LRU cache for API responses. Reduces repeated calls
// for the same track/artist/album data within a session.
// Nothing sensitive is cached. Cache is cleared on app restart.
// ============================================================

interface CacheEntry<T> {
  value:     T;
  expiresAt: number;
}

class MetadataCacheClass {
  private cache   = new Map<string, CacheEntry<unknown>>();
  private maxSize = 200;
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number { return this.cache.size; }
}

export const MetadataCache = new MetadataCacheClass();

// ---- Cached search helper ----
export async function cachedSearch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  const cached = MetadataCache.get<T>(cacheKey);
  if (cached !== null) return cached;
  const result = await fetcher();
  MetadataCache.set(cacheKey, result, ttlMs);
  return result;
}
