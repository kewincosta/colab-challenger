import { describe, it, expect } from 'vitest';
import { LocationFormatConstraint } from '../../../src/presentation/http/validators/location-format.validator';

describe('LocationFormatConstraint', () => {
  const validator = new LocationFormatConstraint();

  // ── Valid inputs ──────────────────────────────────────────────────

  it('accepts a valid structured address', () => {
    expect(
      validator.validate({
        street: 'Praça da Sé',
        number: '123',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01001-000',
      }),
    ).toBe(true);
  });

  it('accepts a structured address with optional complement', () => {
    expect(
      validator.validate({
        street: 'Praça da Sé',
        number: '123',
        complement: 'Bloco B',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01001-000',
      }),
    ).toBe(true);
  });

  // ── Invalid inputs ────────────────────────────────────────────────

  it('rejects a plain string', () => {
    expect(validator.validate('Main Street')).toBe(false);
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

  it('rejects an object missing required fields', () => {
    expect(validator.validate({ lat: -23.55, lng: -46.63 })).toBe(false);
  });

  // ── Default message ───────────────────────────────────────────────

  it('returns a meaningful default message', () => {
    const msg = validator.defaultMessage({
      property: 'location',
    } as any);
    expect(msg).toContain('location');
    expect(msg).toContain('structured');
  });
});
