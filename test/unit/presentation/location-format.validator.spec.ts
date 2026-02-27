import { describe, it, expect } from 'vitest';
import { LocationFormatConstraint } from '../../../src/presentation/http/validators/location-format.validator';

describe('LocationFormatConstraint', () => {
  const validator = new LocationFormatConstraint();

  // ── Valid inputs ──────────────────────────────────────────────────

  it('accepts a non-empty string', () => {
    expect(validator.validate('Main Street')).toBe(true);
  });

  it('accepts a non-empty object', () => {
    expect(validator.validate({ lat: -23.55, lng: -46.63 })).toBe(true);
  });

  // ── Invalid inputs ────────────────────────────────────────────────

  it('rejects an empty string', () => {
    expect(validator.validate('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(validator.validate('   ')).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(validator.validate({})).toBe(false);
  });

  it('rejects null', () => {
    expect(validator.validate(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validator.validate(undefined)).toBe(false);
  });

  it('rejects a number', () => {
    expect(validator.validate(123)).toBe(false);
  });

  // ── Default message ───────────────────────────────────────────────

  it('returns a meaningful default message', () => {
    const msg = validator.defaultMessage({
      property: 'location',
    } as any);
    expect(msg).toContain('location');
    expect(msg).toContain('non-empty');
  });
});
