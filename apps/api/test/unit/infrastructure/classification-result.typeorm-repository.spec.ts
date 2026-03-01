import { describe, it, expect, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { ClassificationResultTypeOrmRepository } from '../../../src/infrastructure/database/typeorm/repositories/classification-result.typeorm-repository';
import { ClassificationResultOrmEntity } from '../../../src/infrastructure/database/typeorm/entities/classification-result.orm-entity';
import { ClassificationResult } from '../../../src/domain/reports/entities/classification-result.entity';
import { TriageStatus } from '../../../src/domain/reports/value-objects/triage-status.value-object';

function buildSavedEntity(
  overrides: Partial<ClassificationResultOrmEntity> = {},
): ClassificationResultOrmEntity {
  const saved = new ClassificationResultOrmEntity();
  saved.id = overrides.id ?? 1;
  saved.externalId = overrides.externalId ?? 'cr-uuid-1';
  saved.reportExternalId = overrides.reportExternalId ?? 'report-1';
  saved.category = overrides.category ?? 'Iluminação Pública';
  saved.priority = overrides.priority ?? 'Alta';
  saved.technicalSummary = overrides.technicalSummary ?? 'Poste com defeito.';
  saved.triageStatus = overrides.triageStatus ?? 'PENDING';
  saved.createdAt = overrides.createdAt ?? new Date('2026-01-15T10:00:00Z');
  saved.updatedAt = overrides.updatedAt ?? new Date('2026-01-15T10:00:00Z');
  return saved;
}

describe('ClassificationResultTypeOrmRepository', () => {
  it('maps and saves a classification result', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ClassificationResultOrmEntity) =>
        buildSavedEntity({
          reportExternalId: entity.reportExternalId,
          category: entity.category,
          priority: entity.priority,
          technicalSummary: entity.technicalSummary,
          triageStatus: entity.triageStatus,
        }),
      ),
    } as unknown as Repository<ClassificationResultOrmEntity>;

    const repo = new ClassificationResultTypeOrmRepository(ormRepo);

    const result = ClassificationResult.create({
      reportId: 'report-1',
      category: 'Iluminação Pública',
      priority: 'Alta',
      technicalSummary: 'Poste com defeito necessitando reparo.',
    });

    const saved = await repo.save(result);

    expect(saved.getId()).toBe('cr-uuid-1');
    expect(saved.getReportId()).toBe('report-1');
    expect(saved.getCategory()).toBe('Iluminação Pública');
    expect(saved.getPriority()).toBe('Alta');
    expect(saved.getTechnicalSummary()).toBe('Poste com defeito necessitando reparo.');
    expect(saved.getTriageStatus()).toBe(TriageStatus.PENDING);
    expect(ormRepo.save).toHaveBeenCalledOnce();
  });

  it('findByReportId returns a domain entity when found', async () => {
    const ormRepo = {
      findOneBy: vi.fn(async () =>
        buildSavedEntity({
          id: 5,
          externalId: 'cr-found',
          reportExternalId: 'report-42',
          category: 'Infraestrutura Urbana',
          priority: 'Média',
          technicalSummary: 'Degradação detectada.',
        }),
      ),
    } as unknown as Repository<ClassificationResultOrmEntity>;

    const repo = new ClassificationResultTypeOrmRepository(ormRepo);
    const result = await repo.findByReportId('report-42');

    expect(result).not.toBeNull();
    expect(result!.getId()).toBe('cr-found');
    expect(result!.getReportId()).toBe('report-42');
    expect(result!.getCategory()).toBe('Infraestrutura Urbana');
    expect(ormRepo.findOneBy).toHaveBeenCalledWith({ reportExternalId: 'report-42' });
  });

  it('findByReportId returns null when not found', async () => {
    const ormRepo = {
      findOneBy: vi.fn(async () => null),
    } as unknown as Repository<ClassificationResultOrmEntity>;

    const repo = new ClassificationResultTypeOrmRepository(ormRepo);
    const result = await repo.findByReportId('non-existent');

    expect(result).toBeNull();
  });

  it('maps ORM entity fields to domain correctly', async () => {
    const createdAt = new Date('2026-03-01T08:00:00Z');
    const updatedAt = new Date('2026-03-01T08:01:00Z');

    const ormRepo = {
      save: vi.fn(async () =>
        buildSavedEntity({
          id: 7,
          externalId: 'cr-mapped',
          reportExternalId: 'report-99',
          category: 'Outros',
          priority: 'Baixa',
          technicalSummary: 'Fora do escopo.',
          triageStatus: 'PENDING',
          createdAt,
          updatedAt,
        }),
      ),
    } as unknown as Repository<ClassificationResultOrmEntity>;

    const repo = new ClassificationResultTypeOrmRepository(ormRepo);

    const result = ClassificationResult.create({
      reportId: 'report-99',
      category: 'Outros',
      priority: 'Baixa',
      technicalSummary: 'Fora do escopo.',
    });

    const saved = await repo.save(result);

    expect(saved.getCreatedAt()).toEqual(createdAt);
    expect(saved.getUpdatedAt()).toEqual(updatedAt);
    expect(saved.getTriageStatus()).toBe(TriageStatus.PENDING);
  });
});
