import { describe, it, expect } from 'vitest';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';

describe('Report Entity', () => {
  const validProps = () => ({
    title: 'Broken streetlight',
    description: 'The light on Rua das Flores has been out for 3 days.',
    location: Location.create('Rua das Flores, 123'),
  });

  it('creates a report without AI classification', () => {
    const report = Report.create(validProps());

    expect(report.getId()).toBeUndefined();
    expect(report.getTitle()).toBe('Broken streetlight');
    expect(report.getDescription()).toBe('The light on Rua das Flores has been out for 3 days.');
    expect(report.getAiClassification()).toBeNull();
    expect(report.getCreatedAt()).toBeInstanceOf(Date);
  });

  it('restores a report with AI classification', () => {
    const report = Report.restore(
      {
        ...validProps(),
        createdAt: new Date('2025-01-15T10:00:00Z'),
        aiClassification: {
          category: 'Lighting',
          priority: 'High',
          technicalSummary: 'Streetlight malfunction.',
          newCategorySuggestion: null,
        },
      },
      'abc-123',
    );

    expect(report.getId()).toBe('abc-123');
    expect(report.getAiClassification()).toEqual({
      category: 'Lighting',
      priority: 'High',
      technicalSummary: 'Streetlight malfunction.',
      newCategorySuggestion: null,
    });
  });

  it('enriches a report with AI classification', () => {
    const report = Report.create(validProps());
    expect(report.getAiClassification()).toBeNull();

    report.enrichWithAiClassification({
      category: 'Public Road',
      priority: 'Medium',
      technicalSummary: 'Surface degradation detected.',
      newCategorySuggestion: null,
    });

    expect(report.getAiClassification()).toEqual({
      category: 'Public Road',
      priority: 'Medium',
      technicalSummary: 'Surface degradation detected.',
      newCategorySuggestion: null,
    });
  });

  it('enriches a report with "Other" category and suggestion', () => {
    const report = Report.create(validProps());

    report.enrichWithAiClassification({
      category: 'Other',
      priority: 'Low',
      technicalSummary: 'Unusual urban fauna spotted.',
      newCategorySuggestion: 'Urban Fauna',
    });

    const ai = report.getAiClassification();
    expect(ai?.category).toBe('Other');
    expect(ai?.newCategorySuggestion).toBe('Urban Fauna');
  });

  it('overwrites previous AI classification when enriched again', () => {
    const report = Report.create(validProps());

    report.enrichWithAiClassification({
      category: 'Lighting',
      priority: 'High',
      technicalSummary: 'First classification.',
      newCategorySuggestion: null,
    });

    report.enrichWithAiClassification({
      category: 'Sanitation',
      priority: 'Low',
      technicalSummary: 'Second classification.',
      newCategorySuggestion: null,
    });

    expect(report.getAiClassification()?.category).toBe('Sanitation');
    expect(report.getAiClassification()?.technicalSummary).toBe('Second classification.');
  });

  it('updates description via updateDescription()', () => {
    const report = Report.create(validProps());
    expect(report.getDescription()).toBe('The light on Rua das Flores has been out for 3 days.');

    report.updateDescription('Updated description after inspection.');
    expect(report.getDescription()).toBe('Updated description after inspection.');
  });

  it('updateDescription rejects empty string', () => {
    const report = Report.create(validProps());
    expect(() => report.updateDescription('')).toThrow();
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
