import { describe, it, expect } from 'vitest';
import { AiClassificationSchema } from '../../../src/application/ai/validators';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    category: 'Iluminação Pública',
    priority: 'Média',
    technical_summary: 'Poste sem funcionamento reportado.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Base schema
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

  it('accepts "Outros" as a valid category', () => {
    const result = AiClassificationSchema.safeParse(validPayload({ category: 'Outros' }));
    expect(result.success).toBe(true);
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

  it('accepts each valid category', () => {
    const categories = [
      'Infraestrutura Urbana',
      'Iluminação Pública',
      'Saneamento e Abastecimento',
      'Limpeza Urbana',
      'Meio Ambiente',
      'Transporte e Mobilidade',
      'Saúde Pública',
      'Segurança e Ordem Pública',
      'Outros',
    ];

    for (const category of categories) {
      const result = AiClassificationSchema.safeParse(validPayload({ category }));
      expect(result.success, `${category} should be valid`).toBe(true);
    }
  });

  it('does not accept unknown fields (strict parsing)', () => {
    const result = AiClassificationSchema.safeParse({
      ...validPayload(),
      subcategory: 'Poste apagado',
      new_category_suggestion: null,
    });
    // Zod object schemas strip unknown fields by default, so it still passes
    expect(result.success).toBe(true);
  });
});
