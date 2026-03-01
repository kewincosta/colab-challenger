import { describe, it, expect } from 'vitest';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import type { StructuredLocation } from '../../../src/domain/reports/value-objects/location.value-object';
import { InvalidLocationException } from '../../../src/domain/reports/exceptions/invalid-location.exception';

describe('Location Value Object', () => {
  // ── Valid structured locations ────────────────────────────────────

  const VALID_STRUCTURED: StructuredLocation = {
    street: 'Praça da Sé',
    number: '123',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
    postcode: '01001-000',
  };

  it('creates from a valid StructuredLocation object', () => {
    const location = Location.create(VALID_STRUCTURED);
    const value = location.getValue();
    expect(value.street).toBe('Praça da Sé');
    expect(value.postcode).toBe('01001-000');
  });

  it('creates StructuredLocation with optional complement', () => {
    const withComplement = { ...VALID_STRUCTURED, complement: 'Bloco B' };
    const location = Location.create(withComplement);
    expect(location.getValue().complement).toBe('Bloco B');
  });

  it('trims whitespace from string fields', () => {
    const location = Location.create({
      ...VALID_STRUCTURED,
      street: '  Rua das Flores  ',
      city: ' Curitiba ',
    });
    const value = location.getValue();
    expect(value.street).toBe('Rua das Flores');
    expect(value.city).toBe('Curitiba');
  });

  it('returns a defensive copy', () => {
    const location = Location.create(VALID_STRUCTURED);
    const a = location.getValue();
    const b = location.getValue();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  // ── Invalid inputs ────────────────────────────────────────────────

  it('throws for a plain string', () => {
    expect(() => Location.create('Rua das Flores, 123')).toThrow(InvalidLocationException);
  });

  it('throws for an empty object', () => {
    expect(() => Location.create({})).toThrow(InvalidLocationException);
  });

  it('throws for null', () => {
    expect(() => Location.create(null)).toThrow(InvalidLocationException);
  });

  it('throws for an object missing required fields', () => {
    expect(() => Location.create({ lat: -23.55, lng: -46.63 })).toThrow(InvalidLocationException);
  });

  it('throws when a required field is an empty string', () => {
    expect(() => Location.create({ ...VALID_STRUCTURED, street: '' })).toThrow(
      InvalidLocationException,
    );
  });

  it('throws when a required field is not a string', () => {
    expect(() => Location.create({ ...VALID_STRUCTURED, number: 42 })).toThrow(
      InvalidLocationException,
    );
  });
});
