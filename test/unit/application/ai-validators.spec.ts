import { describe, it, expect } from 'vitest';
import {
  AiClassificationSchema,
  AiClassificationSchemaRefined,
} from '../../../src/application/ai/validators';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    category: 'Lighting',
    new_category_suggestion: null,
    priority: 'Medium',
    technical_summary: 'Non-functional streetlight reported.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Base schema (no cross-field refinement)
// ---------------------------------------------------------------------------

describe('AiClassificationSchema', () => {
  it('accepts a valid payload', () => {
    const result = AiClassificationSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it('rejects an invalid category', () => {
    const result = AiClassificationSchema.safeParse(validPayload({ category: 'Teleportation' }));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid priority', () => {
    const result = AiClassificationSchema.safeParse(validPayload({ priority: 'Urgent' }));
    expect(result.success).toBe(false);
  });

  it('rejects empty technical_summary', () => {
    const result = AiClassificationSchema.safeParse(validPayload({ technical_summary: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects technical_summary exceeding 600 characters', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({ technical_summary: 'x'.repeat(601) }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects new_category_suggestion exceeding 40 characters', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Other',
        new_category_suggestion: 'A'.repeat(41),
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects new_category_suggestion with lowercase start', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Other',
        new_category_suggestion: 'lowercase',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects new_category_suggestion with punctuation', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Other',
        new_category_suggestion: 'Has Punctuation!',
      }),
    );
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Refined schema (cross-field: category ↔ new_category_suggestion)
// ---------------------------------------------------------------------------

describe('AiClassificationSchemaRefined', () => {
  it('accepts category="Other" with a valid new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Other',
        new_category_suggestion: 'Water Supply',
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects category="Other" with null new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Other',
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts non-Other category with null new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Lighting',
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects non-Other category with a new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Lighting',
        new_category_suggestion: 'Something',
      }),
    );
    expect(result.success).toBe(false);
  });
});
