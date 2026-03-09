/**
 * Input normalization utilities for deterministic cache key generation.
 */

import { createHash } from 'node:crypto';

/**
 * Normalize a text string for cache keying:
 * - lowercase
 * - collapse whitespace
 * - trim
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/gv, ' ').trim();
}

/**
 * Produce a canonical location string for cache keying.
 *
 * - CEP (Brazilian postal code): digits only.
 * - Generic string: normalize text.
 * - Object: stringify with sorted keys.
 */
export function canonicalizeLocation(location: string | Record<string, unknown>): string {
  if (typeof location === 'string') {
    const digitsOnly = location.replace(/\D/gv, '');
    const isCep = /^\d{5,8}$/v.test(digitsOnly);
    if (isCep) return `CEP:${digitsOnly}`;
    return `STR:${normalizeText(location)}`;
  }

  // Fallback: stringify with sorted keys
  const sorted = JSON.stringify(location, Object.keys(location).sort());
  return `OBJ:${sorted}`;
}

/**
 * Build a deterministic SHA-256 cache key.
 */
export function buildCacheKey(
  promptVersion: string,
  title: string,
  description: string,
  location: string | Record<string, unknown>,
): string {
  const parts = [
    promptVersion,
    normalizeText(title),
    normalizeText(description),
    canonicalizeLocation(location),
  ].join('|');

  return createHash('sha256').update(parts).digest('hex');
}
