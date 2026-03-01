import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  canonicalizeLocation,
  buildCacheKey,
} from '../../../src/application/ai/normalization';

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe('normalizeText', () => {
  it('lowercases and trims', () => {
    expect(normalizeText('  Hello World  ')).toBe('hello world');
  });

  it('collapses multiple whitespace characters', () => {
    expect(normalizeText('a   b\t\tc')).toBe('a b c');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeText('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// canonicalizeLocation
// ---------------------------------------------------------------------------

describe('canonicalizeLocation', () => {
  it('detects 8-digit CEP with hyphens', () => {
    expect(canonicalizeLocation('01310-100')).toBe('CEP:01310100');
  });

  it('detects 5-digit CEP', () => {
    expect(canonicalizeLocation('01310')).toBe('CEP:01310');
  });

  it('normalizes generic string locations', () => {
    expect(canonicalizeLocation('  Main  Street  ')).toBe('STR:main street');
  });

  it('formats lat/lng object with 4 decimal precision', () => {
    expect(canonicalizeLocation({ lat: -23.550520123, lng: -46.633308456 })).toBe(
      'MAP:-23.5505,-46.6333',
    );
  });

  it('falls back to sorted JSON for unknown object shapes', () => {
    const result = canonicalizeLocation({ address: '123 St', city: 'SP' });
    expect(result).toMatch(/^OBJ:/v);
    expect(result).toContain('"address"');
  });
});

// ---------------------------------------------------------------------------
// buildCacheKey
// ---------------------------------------------------------------------------

describe('buildCacheKey', () => {
  it('produces a 64-char hex SHA-256 hash', () => {
    const key = buildCacheKey('v1', 'title', 'desc', 'location');
    expect(key).toMatch(/^[a-f0-9]{64}$/v);
  });

  it('is deterministic — same inputs produce same key', () => {
    const args = ['v1', 'title', 'desc', 'loc'] as const;
    expect(buildCacheKey(...args)).toBe(buildCacheKey(...args));
  });

  it('varies when any input changes', () => {
    const base = buildCacheKey('v1', 'title', 'desc', 'loc');
    expect(buildCacheKey('v2', 'title', 'desc', 'loc')).not.toBe(base);
    expect(buildCacheKey('v1', 'other', 'desc', 'loc')).not.toBe(base);
    expect(buildCacheKey('v1', 'title', 'other', 'loc')).not.toBe(base);
    expect(buildCacheKey('v1', 'title', 'desc', 'other')).not.toBe(base);
  });

  it('normalizes whitespace and case for determinism', () => {
    const a = buildCacheKey('v1', ' Title ', '  Desc  ', 'loc');
    const b = buildCacheKey('v1', 'title', 'desc', 'loc');
    expect(a).toBe(b);
  });
});
