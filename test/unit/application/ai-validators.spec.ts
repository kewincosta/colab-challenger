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
    category: 'Iluminação Pública',
    subcategory: 'Poste apagado',
    new_category_suggestion: null,
    priority: 'Média',
    technical_summary: 'Poste sem funcionamento reportado.',
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

  it('rejects an invalid subcategory', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({ subcategory: 'Categoria Inexistente' }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts null subcategory in base schema', () => {
    const result = AiClassificationSchema.safeParse(validPayload({ subcategory: null }));
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

  it('rejects new_category_suggestion exceeding 40 characters', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: null,
        new_category_suggestion: 'A'.repeat(41),
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects new_category_suggestion with lowercase start', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: null,
        new_category_suggestion: 'minúsculas',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects new_category_suggestion with punctuation', () => {
    const result = AiClassificationSchema.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: null,
        new_category_suggestion: 'Tem Pontuação!',
      }),
    );
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Refined schema (cross-field: category ↔ subcategory ↔ new_category_suggestion)
// ---------------------------------------------------------------------------

describe('AiClassificationSchemaRefined', () => {
  it('accepts category="Outros" with null subcategory and valid new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: null,
        new_category_suggestion: 'Educação Municipal',
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects category="Outros" with null new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: null,
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects category="Outros" with a non-null subcategory', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Outros',
        subcategory: 'Poste apagado',
        new_category_suggestion: 'Educação Municipal',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts non-Outros category with valid subcategory and null new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Iluminação Pública',
        subcategory: 'Poste apagado',
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects non-Outros category with null subcategory', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Iluminação Pública',
        subcategory: null,
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects non-Outros category with a new_category_suggestion', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Iluminação Pública',
        subcategory: 'Poste apagado',
        new_category_suggestion: 'Algo',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects subcategory that does not belong to the selected category', () => {
    const result = AiClassificationSchemaRefined.safeParse(
      validPayload({
        category: 'Iluminação Pública',
        subcategory: 'Buracos na via', // belongs to Infraestrutura Urbana
        new_category_suggestion: null,
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts each category with its own valid subcategory', () => {
    const testCases = [
      { category: 'Infraestrutura Urbana', subcategory: 'Buracos na via' },
      { category: 'Saneamento e Abastecimento', subcategory: 'Vazamento de esgoto' },
      { category: 'Limpeza Urbana', subcategory: 'Entulho irregular' },
      { category: 'Meio Ambiente', subcategory: 'Poda de árvore' },
      { category: 'Transporte e Mobilidade', subcategory: 'Semáforo quebrado' },
      { category: 'Saúde Pública', subcategory: 'Foco de dengue' },
      { category: 'Segurança e Ordem Pública', subcategory: 'Denúncia de vandalismo' },
    ];

    for (const { category, subcategory } of testCases) {
      const result = AiClassificationSchemaRefined.safeParse(
        validPayload({ category, subcategory, new_category_suggestion: null }),
      );
      expect(result.success, `${category} → ${subcategory} should be valid`).toBe(true);
    }
  });
});
