import { describe, it, expect } from 'vitest';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { InvalidLocationException } from '../../../src/domain/reports/exceptions/invalid-location.exception';

describe('Location Value Object', () => {
  // ── String locations ──────────────────────────────────────────────

  it('creates from a valid non-empty string', () => {
    const location = Location.create('Rua das Flores, 123');
    expect(location.getValue()).toBe('Rua das Flores, 123');
  });

  it('trims whitespace from string locations', () => {
    const location = Location.create('  Main Street  ');
    expect(location.getValue()).toBe('Main Street');
  });

  it('throws InvalidLocationException for empty string', () => {
    expect(() => Location.create('')).toThrow(InvalidLocationException);
  });

  it('throws InvalidLocationException for whitespace-only string', () => {
    expect(() => Location.create('   ')).toThrow(InvalidLocationException);
  });

  // ── Object locations ──────────────────────────────────────────────

  it('creates from a valid non-empty object', () => {
    const raw = { lat: -23.55, lng: -46.63 };
    const location = Location.create(raw);
    expect(location.getValue()).toEqual({ lat: -23.55, lng: -46.63 });
  });

  it('throws InvalidLocationException for empty object', () => {
    expect(() => Location.create({})).toThrow(InvalidLocationException);
  });

  it('returns a defensive copy for object locations', () => {
    const raw = { lat: -23.55, lng: -46.63 };
    const location = Location.create(raw);
    const value = location.getValue() as Record<string, unknown>;
    value.lat = 0;
    expect((location.getValue() as Record<string, unknown>).lat).toBe(-23.55);
  });
});
