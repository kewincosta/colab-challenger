import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryLruCache } from '../../../src/infrastructure/ai/cache/memory-lru.cache';

describe('MemoryLruCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(10, 60_000);

    // Act
    cache.set('key', 'value');

    // Assert
    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined for missing keys', () => {
    const cache = new MemoryLruCache<string>(10, 60_000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns undefined after TTL expires', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(10, 1_000);
    cache.set('key', 'value');

    // Act
    vi.advanceTimersByTime(1_001);

    // Assert
    expect(cache.get('key')).toBeUndefined();
  });

  it('evicts the least recently used entry when maxSize is reached', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(3, 60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Act — adding 'd' should evict 'a' (oldest)
    cache.set('d', '4');

    // Assert
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('d')).toBe('4');
    expect(cache.size).toBe(3);
  });

  it('refreshes position on get — accessed item is not evicted', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(3, 60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Act — access 'a' to refresh it; then add 'd'
    cache.get('a');
    cache.set('d', '4');

    // Assert — 'b' should be evicted (oldest after 'a' was refreshed)
    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('d')).toBe('4');
  });

  it('has() returns false for expired entries', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(10, 1_000);
    cache.set('key', 'value');

    // Act
    vi.advanceTimersByTime(1_001);

    // Assert
    expect(cache.has('key')).toBe(false);
  });

  it('clear() removes all entries', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(10, 60_000);
    cache.set('a', '1');
    cache.set('b', '2');

    // Act
    cache.clear();

    // Assert
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('overwrites existing key and refreshes position', () => {
    // Arrange
    const cache = new MemoryLruCache<string>(3, 60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Act — overwrite 'a', then add 'd'
    cache.set('a', 'updated');
    cache.set('d', '4');

    // Assert — 'b' should be evicted, 'a' should be refreshed
    expect(cache.get('a')).toBe('updated');
    expect(cache.get('b')).toBeUndefined();
  });
});
