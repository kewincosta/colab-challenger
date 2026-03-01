import { describe, it, expect } from 'vitest';
import { toMappedClassification } from '../../../src/application/ai/mappers/classification.mapper';
import type { AiClassificationResult } from '../../../src/application/ai/types';

describe('toMappedClassification mapper', () => {
  it('maps snake_case AI result to camelCase mapped classification', () => {
    const aiResult: AiClassificationResult = {
      category: 'Iluminação Pública',
      priority: 'Alta',
      technical_summary: 'Poste sem funcionamento.',
    };

    const result = toMappedClassification(aiResult);

    expect(result).toEqual({
      category: 'Iluminação Pública',
      priority: 'Alta',
      technicalSummary: 'Poste sem funcionamento.',
    });
  });

  it('maps "Outros" category correctly', () => {
    const aiResult: AiClassificationResult = {
      category: 'Outros',
      priority: 'Baixa',
      technical_summary: 'Demanda fora do escopo das categorias existentes.',
    };

    const result = toMappedClassification(aiResult);

    expect(result.category).toBe('Outros');
    expect(result.technicalSummary).toBe('Demanda fora do escopo das categorias existentes.');
  });
});
