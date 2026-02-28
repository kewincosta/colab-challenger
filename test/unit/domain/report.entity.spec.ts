import { describe, it, expect } from 'vitest';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';

describe('Report Entity', () => {
  const validProps = () => ({
    title: 'Broken streetlight',
    description: 'The light on Rua das Flores has been out for 3 days.',
    location: Location.create('Rua das Flores, 123'),
  });

  it('creates a report with PENDING classification status', () => {
    const report = Report.create(validProps());

    expect(report.getId()).toBeUndefined();
    expect(report.getTitle()).toBe('Broken streetlight');
    expect(report.getDescription()).toBe('The light on Rua das Flores has been out for 3 days.');
    expect(report.getAiClassification()).toBeNull();
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.PENDING);
    expect(report.getClassificationAttempts()).toBe(0);
    expect(report.getLastClassificationError()).toBeNull();
    expect(report.getClassifiedAt()).toBeNull();
    expect(report.getCreatedAt()).toBeInstanceOf(Date);
  });

  it('restores a report with AI classification and DONE status', () => {
    const report = Report.restore(
      {
        ...validProps(),
        createdAt: new Date('2025-01-15T10:00:00Z'),
        aiClassification: {
          category: 'Iluminação Pública',
          subcategory: 'Poste apagado',
          priority: 'Alta',
          technicalSummary: 'Poste sem funcionamento.',
          newCategorySuggestion: null,
        },
        classificationStatus: ClassificationStatus.DONE,
        classifiedAt: new Date('2025-01-15T10:01:00Z'),
      },
      'abc-123',
    );

    expect(report.getId()).toBe('abc-123');
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.DONE);
    expect(report.getAiClassification()).toEqual({
      category: 'Iluminação Pública',
      subcategory: 'Poste apagado',
      priority: 'Alta',
      technicalSummary: 'Poste sem funcionamento.',
      newCategorySuggestion: null,
    });
  });

  // ── Classification lifecycle ────────────────────────────────────────

  it('startClassification transitions PENDING → PROCESSING', () => {
    const report = Report.create(validProps());
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.PENDING);

    report.startClassification();
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.PROCESSING);
  });

  it('startClassification is a no-op when already DONE', () => {
    const report = Report.restore(
      {
        ...validProps(),
        classificationStatus: ClassificationStatus.DONE,
        aiClassification: {
          category: 'Iluminação Pública',
          subcategory: 'Poste apagado',
          priority: 'Alta',
          technicalSummary: 'Concluído.',
          newCategorySuggestion: null,
        },
      },
      'abc-123',
    );

    report.startClassification();
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.DONE);
  });

  it('startClassification allows FAILED → PROCESSING (retry)', () => {
    const report = Report.create(validProps());
    report.failClassification('timeout', 1);
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.FAILED);

    report.startClassification();
    expect(report.getClassificationStatus()).toBe(ClassificationStatus.PROCESSING);
  });

  it('completeClassification sets AI data, DONE status, and classifiedAt', () => {
    const report = Report.create(validProps());
    report.startClassification();

    const completedAt = new Date('2026-02-27T12:00:00Z');
    report.completeClassification(
      {
        category: 'Infraestrutura Urbana',
        subcategory: 'Buracos na via',
        priority: 'Média',
        technicalSummary: 'Degradação de superfície detectada.',
        newCategorySuggestion: null,
      },
      completedAt,
    );

    expect(report.getClassificationStatus()).toBe(ClassificationStatus.DONE);
    expect(report.getClassifiedAt()).toEqual(completedAt);
    expect(report.getAiClassification()).toEqual({
      category: 'Infraestrutura Urbana',
      subcategory: 'Buracos na via',
      priority: 'Média',
      technicalSummary: 'Degradação de superfície detectada.',
      newCategorySuggestion: null,
    });
  });

  it('failClassification records error and attempt count', () => {
    const report = Report.create(validProps());
    report.startClassification();
    report.failClassification('AI timeout', 2);

    expect(report.getClassificationStatus()).toBe(ClassificationStatus.FAILED);
    expect(report.getLastClassificationError()).toBe('AI timeout');
    expect(report.getClassificationAttempts()).toBe(2);
  });

  // ── Mutation methods ────────────────────────────────────────────────

  it('updates description via updateDescription()', () => {
    const report = Report.create(validProps());
    expect(report.getDescription()).toBe('The light on Rua das Flores has been out for 3 days.');

    report.updateDescription('Updated description after inspection.');
    expect(report.getDescription()).toBe('Updated description after inspection.');
  });

  it('updateDescription rejects empty string', () => {
    const report = Report.create(validProps());
    expect(() => {
      report.updateDescription('');
    }).toThrow();
  });

  it('moves to a new location via moveTo()', () => {
    const report = Report.create(validProps());
    const newLocation = Location.create('Rua Nova, 456');

    report.moveTo(newLocation);
    expect(report.getLocation().getValue()).toBe('Rua Nova, 456');
  });

  it('moveTo replaces the previous location', () => {
    const report = Report.create(validProps());
    expect(report.getLocation().getValue()).toBe('Rua das Flores, 123');

    report.moveTo(Location.create({ lat: -23.55, lng: -46.63 }));
    expect(report.getLocationRaw()).toEqual({ lat: -23.55, lng: -46.63 });
  });
});
