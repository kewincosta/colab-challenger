/**
 * Unit tests for RedisCacheAdapter.
 *
 * Uses a minimal mock of the ioredis client to verify serialisation,
 * TTL delegation, prefix namespacing, and error handling without
 * requiring a real Redis instance (Fast + Independent).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCacheAdapter } from '../../../src/infrastructure/ai/cache/redis.cache';

// ── Minimal Redis mock ────────────────────────────────────────────────

function createMockRedis() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    scan: vi.fn().mockResolvedValue(['0', []]),
  };
}

type MockRedis = ReturnType<typeof createMockRedis>;

const OPTIONS = { prefix: 'test:', ttlSeconds: 3600 };

describe('RedisCacheAdapter', () => {
  let redis: MockRedis;
  let cache: RedisCacheAdapter<{ name: string }>;

  beforeEach(() => {
    redis = createMockRedis();

    cache = new RedisCacheAdapter(redis as any, OPTIONS);
  });

  // ── get ───────────────────────────────────────────────────────────

  it('returns undefined when key does not exist', async () => {
    const result = await cache.get('missing');

    expect(result).toBeUndefined();
    expect(redis.get).toHaveBeenCalledWith('test:missing');
  });

  it('deserialises and returns stored value', async () => {
    // Arrange
    const stored = { name: 'test-value' };
    redis.get.mockResolvedValue(JSON.stringify(stored));

    // Act
    const result = await cache.get('key1');

    // Assert
    expect(result).toEqual(stored);
    expect(redis.get).toHaveBeenCalledWith('test:key1');
  });

  it('returns undefined and deletes corrupted entries', async () => {
    // Arrange
    redis.get.mockResolvedValue('not-valid-json{');

    // Act
    const result = await cache.get('bad');

    // Assert
    expect(result).toBeUndefined();
    expect(redis.del).toHaveBeenCalledWith('test:bad');
  });

  // ── set ───────────────────────────────────────────────────────────

  it('serialises value and sets with TTL', async () => {
    // Arrange
    const value = { name: 'hello' };

    // Act
    await cache.set('key1', value);

    // Assert
    expect(redis.set).toHaveBeenCalledWith('test:key1', JSON.stringify(value), 'EX', 3600);
  });

  // ── has ───────────────────────────────────────────────────────────

  it('returns false when key does not exist', async () => {
    redis.exists.mockResolvedValue(0);

    expect(await cache.has('missing')).toBe(false);
    expect(redis.exists).toHaveBeenCalledWith('test:missing');
  });

  it('returns true when key exists', async () => {
    redis.exists.mockResolvedValue(1);

    expect(await cache.has('present')).toBe(true);
  });

  // ── clear ─────────────────────────────────────────────────────────

  it('deletes all keys matching prefix via SCAN', async () => {
    // Arrange — simulate two SCAN iterations
    redis.scan
      .mockResolvedValueOnce(['42', ['test:a', 'test:b']])
      .mockResolvedValueOnce(['0', ['test:c']]);

    // Act
    await cache.clear();

    // Assert
    expect(redis.scan).toHaveBeenCalledTimes(2);
    expect(redis.del).toHaveBeenCalledWith('test:a', 'test:b');
    expect(redis.del).toHaveBeenCalledWith('test:c');
  });

  it('handles clear when no keys exist', async () => {
    redis.scan.mockResolvedValue(['0', []]);

    await cache.clear();

    expect(redis.del).not.toHaveBeenCalled();
  });

  // ── getSize ───────────────────────────────────────────────────────

  it('counts keys matching prefix', async () => {
    // Arrange — two pages of results
    redis.scan
      .mockResolvedValueOnce(['5', ['test:a', 'test:b']])
      .mockResolvedValueOnce(['0', ['test:c']]);

    // Act
    const size = await cache.getSize();

    // Assert
    expect(size).toBe(3);
  });

  it('returns 0 when no keys exist', async () => {
    redis.scan.mockResolvedValue(['0', []]);

    expect(await cache.getSize()).toBe(0);
  });
});
