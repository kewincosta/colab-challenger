import { describe, it, expect } from 'vitest';
import { ClassificationResult } from '../../../src/domain/reports/entities/classification-result.entity';
import { TriageStatus } from '../../../src/domain/reports/value-objects/triage-status.value-object';

describe('ClassificationResult Entity', () => {
  const validProps = () => ({
    reportId: 'report-123',
    category: 'Iluminação Pública',
    priority: 'Alta',
    technicalSummary: 'Poste com defeito necessitando reparo imediato.',
  });

  it('creates a classification result with PENDING triage status by default', () => {
    const result = ClassificationResult.create(validProps());

    expect(result.getId()).toBeUndefined();
    expect(result.getReportId()).toBe('report-123');
    expect(result.getCategory()).toBe('Iluminação Pública');
    expect(result.getPriority()).toBe('Alta');
    expect(result.getTechnicalSummary()).toBe('Poste com defeito necessitando reparo imediato.');
    expect(result.getTriageStatus()).toBe(TriageStatus.PENDING);
    expect(result.getCreatedAt()).toBeInstanceOf(Date);
    expect(result.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it('restores a classification result with ID and timestamps', () => {
    const createdAt = new Date('2026-01-15T10:00:00Z');
    const updatedAt = new Date('2026-01-15T10:01:00Z');

    const result = ClassificationResult.restore(
      {
        ...validProps(),
        triageStatus: TriageStatus.PENDING,
        createdAt,
        updatedAt,
      },
      'cr-uuid-1',
    );

    expect(result.getId()).toBe('cr-uuid-1');
    expect(result.getReportId()).toBe('report-123');
    expect(result.getCategory()).toBe('Iluminação Pública');
    expect(result.getCreatedAt()).toEqual(createdAt);
    expect(result.getUpdatedAt()).toEqual(updatedAt);
  });

  it('preserves all classification fields', () => {
    const result = ClassificationResult.create({
      reportId: 'report-456',
      category: 'Infraestrutura Urbana',
      priority: 'Média',
      technicalSummary: 'Degradação de superfície detectada.',
    });

    expect(result.getCategory()).toBe('Infraestrutura Urbana');
    expect(result.getPriority()).toBe('Média');
    expect(result.getTechnicalSummary()).toBe('Degradação de superfície detectada.');
  });
});
