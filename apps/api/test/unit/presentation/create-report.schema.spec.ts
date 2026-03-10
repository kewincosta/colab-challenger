import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  structuredLocationSchema,
} from '../../../src/presentation/http/dto/create-report.schema';

const VALID_LOCATION = {
  street: 'Praça da Sé',
  number: '123',
  neighborhood: 'Sé',
  city: 'São Paulo',
  state: 'SP',
  postcode: '01001-000',
};

const VALID_REPORT = {
  title: 'Buraco na Rua Principal',
  description: 'Buraco grande próximo ao cruzamento.',
  location: VALID_LOCATION,
};

// ── structuredLocationSchema ──────────────────────────────────────────

describe('structuredLocationSchema', () => {
  it('accepts a valid structured address', () => {
    const result = structuredLocationSchema.safeParse(VALID_LOCATION);
    expect(result.success).toBe(true);
  });

  it('accepts a structured address with optional complement', () => {
    const result = structuredLocationSchema.safeParse({
      ...VALID_LOCATION,
      complement: 'Bloco B',
    });
    expect(result.success).toBe(true);
  });

  it('accepts address without optional number', () => {
    const { number: _, ...locationWithoutNumber } = VALID_LOCATION;
    const result = structuredLocationSchema.safeParse(locationWithoutNumber);
    expect(result.success).toBe(true);
  });

  it('rejects an empty object', () => {
    const result = structuredLocationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects a plain string', () => {
    const result = structuredLocationSchema.safeParse('Main Street');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = structuredLocationSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects undefined', () => {
    const result = structuredLocationSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it('rejects a number', () => {
    const result = structuredLocationSchema.safeParse(123);
    expect(result.success).toBe(false);
  });

  it('rejects an object missing required fields', () => {
    const result = structuredLocationSchema.safeParse({ lat: -23.55, lng: -46.63 });
    expect(result.success).toBe(false);
  });

  it('rejects empty string for required fields', () => {
    const result = structuredLocationSchema.safeParse({ ...VALID_LOCATION, street: '' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields (strict)', () => {
    const result = structuredLocationSchema.safeParse({
      ...VALID_LOCATION,
      unknownField: 'value',
    });
    expect(result.success).toBe(false);
  });
});

// ── createReportSchema ────────────────────────────────────────────────

describe('createReportSchema', () => {
  it('accepts a valid report payload', () => {
    const result = createReportSchema.safeParse(VALID_REPORT);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const { title: _, ...noTitle } = VALID_REPORT;
    const result = createReportSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createReportSchema.safeParse({ ...VALID_REPORT, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const { description: _, ...noDescription } = VALID_REPORT;
    const result = createReportSchema.safeParse(noDescription);
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = createReportSchema.safeParse({ ...VALID_REPORT, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing location', () => {
    const { location: _, ...noLocation } = VALID_REPORT;
    const result = createReportSchema.safeParse(noLocation);
    expect(result.success).toBe(false);
  });

  it('rejects string location', () => {
    const result = createReportSchema.safeParse({ ...VALID_REPORT, location: 'Main St & 3rd Ave' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields at root (strict)', () => {
    const result = createReportSchema.safeParse({ ...VALID_REPORT, unknownField: 'value' });
    expect(result.success).toBe(false);
  });

  it('rejects non-string title', () => {
    const result = createReportSchema.safeParse({ ...VALID_REPORT, title: 42 });
    expect(result.success).toBe(false);
  });

  it('provides path-annotated error messages', () => {
    const result = createReportSchema.safeParse({ title: '', description: '', location: {} });
    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('title');
    expect(paths).toContain('description');
  });
});
