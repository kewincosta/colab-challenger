import { describe, it, expect } from 'vitest';
import { toAiClassification } from '../../../src/application/ai/mappers/classification.mapper';
import type { AiClassificationResult } from '../../../src/application/ai/types';

describe('toAiClassification mapper', () => {
  it('maps snake_case AI result to camelCase domain classification', () => {
    const aiResult: AiClassificationResult = {
      category: 'Lighting',
      new_category_suggestion: null,
      priority: 'High',
      technical_summary: 'Streetlight malfunction.',
    };

    const result = toAiClassification(aiResult);

    expect(result).toEqual({
      category: 'Lighting',
      newCategorySuggestion: null,
      priority: 'High',
      technicalSummary: 'Streetlight malfunction.',
    });
  });

  it('maps "Other" category with suggestion correctly', () => {
    const aiResult: AiClassificationResult = {
      category: 'Other',
      new_category_suggestion: 'Urban Fauna',
      priority: 'Low',
      technical_summary: 'Unusual urban fauna spotted.',
    };

    const result = toAiClassification(aiResult);

    expect(result.category).toBe('Other');
    expect(result.newCategorySuggestion).toBe('Urban Fauna');
    expect(result.technicalSummary).toBe('Unusual urban fauna spotted.');
  });
});
