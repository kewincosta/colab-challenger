/**
 * Redis-backed cache adapter for AI enrichment results.
 *
 * Implements AiCache<T> using ioredis as the underlying client.
 * Values are JSON-serialised and stored with a native Redis TTL.
 * A configurable key prefix avoids collisions with other Redis users
 * (e.g., BullMQ queues sharing the same instance).
 */

import type Redis from 'ioredis';

import type { AiCache } from '../../../application/ports/ai-cache.port';

export interface RedisCacheOptions {
  /** Key prefix to namespace cache entries (e.g., 'ai-cache:'). */
  readonly prefix: string;
  /** Time-to-live in seconds for each entry. */
  readonly ttlSeconds: number;
}

export class RedisCacheAdapter<T> implements AiCache<T> {
  constructor(
    private readonly redis: Redis,
    private readonly options: RedisCacheOptions,
  ) {}

  async get(key: string): Promise<T | undefined> {
    const raw = await this.redis.get(this.prefixed(key));
    if (raw === null) return undefined;

    try {
      const parsed: unknown = JSON.parse(raw);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generic cache; callers validate structure via Zod
      return parsed as T;
    } catch {
      // Corrupted entry — remove and treat as miss
      await this.redis.del(this.prefixed(key));
      return undefined;
    }
  }

  async set(key: string, value: T): Promise<void> {
    const serialised = JSON.stringify(value);
    await this.redis.set(this.prefixed(key), serialised, 'EX', this.options.ttlSeconds);
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redis.exists(this.prefixed(key));
    return exists === 1;
  }

  async clear(): Promise<void> {
    const pattern = `${this.options.prefix}*`;
    let cursor = '0';

    do {
      // eslint-disable-next-line no-await-in-loop -- SCAN pagination requires sequential cursor iteration
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        // eslint-disable-next-line no-await-in-loop -- batch delete within SCAN loop
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async getSize(): Promise<number> {
    const pattern = `${this.options.prefix}*`;
    let cursor = '0';
    let count = 0;

    do {
      // eslint-disable-next-line no-await-in-loop -- SCAN pagination requires sequential cursor iteration
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      count += keys.length;
    } while (cursor !== '0');

    return count;
  }

  private prefixed(key: string): string {
    return `${this.options.prefix}${key}`;
  }
}
