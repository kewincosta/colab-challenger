/**
 * Cache interface for AI enrichment results.
 */
export interface AiCache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  has: (key: string) => boolean;
  clear: () => void;
  readonly size: number;
}
