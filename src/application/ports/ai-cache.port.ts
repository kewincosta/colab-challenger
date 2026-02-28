/**
 * Cache interface for AI enrichment results.
 *
 * All methods are async to support both in-memory and distributed
 * (e.g., Redis) implementations transparently.
 */
export interface AiCache<T> {
  get: (key: string) => Promise<T | undefined>;
  set: (key: string, value: T) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  getSize: () => Promise<number>;
}
