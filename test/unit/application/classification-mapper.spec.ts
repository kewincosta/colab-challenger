import { describe, it, expect } from 'vitest';
import { toAiClassification } from '../../../src/application/ai/mappers/classification.mapper';
import type { AiClassificationResult } from '../../../src/application/ai/types';

describe('toAiClassification mapper', () => {
  it('maps snake_case AI result to camelCase domain classification', () => {
    const aiResult: AiClassificationResult = {
      category: 'Iluminação Pública',
      subcategory: 'Poste apagado',
      new_category_suggestion: null,
      priority: 'Alta',
      technical_summary: 'Poste sem funcionamento.',
    };

    const result = toAiClassification(aiResult);

    expect(result).toEqual({
      category: 'Iluminação Pública',
      subcategory: 'Poste apagado',
      newCategorySuggestion: null,
      priority: 'Alta',
      technicalSummary: 'Poste sem funcionamento.',
    });
  });

  it('maps "Outros" category with suggestion correctly', () => {
    const aiResult: AiClassificationResult = {
      category: 'Outros',
      subcategory: null,
      new_category_suggestion: 'Educação Municipal',
      priority: 'Baixa',
      technical_summary: 'Demanda fora do escopo das categorias existentes.',
    };

    const result = toAiClassification(aiResult);

    expect(result.category).toBe('Outros');
    expect(result.subcategory).toBeNull();
    expect(result.newCategorySuggestion).toBe('Educação Municipal');
    expect(result.technicalSummary).toBe('Demanda fora do escopo das categorias existentes.');
  });
});
