import { describe, it, expect, vi } from 'vitest';
import { Repository } from 'typeorm';
import { ReportTypeOrmRepository } from '../../../src/infrastructure/database/typeorm/repositories/report.typeorm-repository';
import { ReportOrmEntity } from '../../../src/infrastructure/database/typeorm/entities/report.orm-entity';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';

describe('ReportTypeOrmRepository', () => {
  it('maps and saves a report without AI classification', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ReportOrmEntity) => {
        const saved = new ReportOrmEntity();
        saved.id = 'uuid-1';
        saved.title = entity.title;
        saved.description = entity.description;
        saved.location = entity.location;
        saved.category = entity.category;
        saved.priority = entity.priority;
        saved.technicalSummary = entity.technicalSummary;
        saved.newCategorySuggestion = entity.newCategorySuggestion;
        saved.createdAt = new Date();
        return saved;
      }),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);

    const location = Location.create('Main St');
    const report = Report.create({
      title: 'Pothole',
      description: 'Deep pothole near bus stop',
      location,
    });

    const saved = await repo.save(report);

    expect(saved.getId()).toBe('uuid-1');
    expect(saved.getTitle()).toBe('Pothole');
    expect(saved.getLocation().getValue()).toBe('Main St');
    expect(saved.getAiClassification()).toBeNull();
    expect(ormRepo.save).toHaveBeenCalledOnce();
  });

  it('maps and saves a report with AI classification', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ReportOrmEntity) => {
        const saved = new ReportOrmEntity();
        saved.id = 'uuid-2';
        saved.title = entity.title;
        saved.description = entity.description;
        saved.location = entity.location;
        saved.category = entity.category;
        saved.priority = entity.priority;
        saved.technicalSummary = entity.technicalSummary;
        saved.newCategorySuggestion = entity.newCategorySuggestion;
        saved.createdAt = new Date();
        return saved;
      }),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);

    const location = Location.create('Rua das Flores, 123');
    const report = Report.create({
      title: 'Broken streetlight',
      description: 'Streetlight not working for 3 days',
      location,
    });

    report.enrichWithAiClassification({
      category: 'Lighting',
      priority: 'High',
      technicalSummary: 'Streetlight malfunction requiring immediate repair.',
      newCategorySuggestion: null,
    });

    const saved = await repo.save(report);

    expect(saved.getId()).toBe('uuid-2');
    expect(saved.getAiClassification()).toEqual({
      category: 'Lighting',
      priority: 'High',
      technicalSummary: 'Streetlight malfunction requiring immediate repair.',
      newCategorySuggestion: null,
    });

    const savedEntity = (ormRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as ReportOrmEntity;
    expect(savedEntity.category).toBe('Lighting');
    expect(savedEntity.priority).toBe('High');
    expect(savedEntity.technicalSummary).toBe('Streetlight malfunction requiring immediate repair.');
    expect(savedEntity.newCategorySuggestion).toBeNull();
  });
});
