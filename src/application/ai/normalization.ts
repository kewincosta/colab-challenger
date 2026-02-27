/**
 * Input normalization utilities for deterministic cache key generation.
 */

import { createHash } from 'crypto';

/**
 * Normalize a text string for cache keying:
 * - lowercase
 * - collapse whitespace
 * - trim
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Produce a canonical location string for cache keying.
 *
 * - CEP (Brazilian postal code): digits only.
 * - MAP (lat/lng object): round to 4 decimal places, sorted key order.
 * - Generic string: normalize text.
 */
export function canonicalizeLocation(
  location: string | Record<string, unknown>,
): string {
  if (typeof location === 'string') {
    const digitsOnly = location.replace(/\D/g, '');
    const isCep = /^\d{5,8}$/.test(digitsOnly);
    if (isCep) return `CEP:${digitsOnly}`;
    return `STR:${normalizeText(location)}`;
  }

  if (
    typeof location === 'object' &&
    location !== null &&
    'lat' in location &&
    'lng' in location
  ) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return `MAP:${lat.toFixed(4)},${lng.toFixed(4)}`;
    }
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
