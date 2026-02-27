/**
 * In-memory LRU cache with TTL support for AI enrichment results.
 */

import type { AiCache } from '../../../application/ports/ai-cache.port';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryLruCache<T> implements AiCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxSize: number = 500,
    private readonly ttlMs: number = 24 * 60 * 60 * 1000, // 24 hours
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    // Remove existing to refresh position
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    // Evict oldest if at capacity
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
