import { describe, it, expect, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { ReportTypeOrmRepository } from '../../../src/infrastructure/database/typeorm/repositories/report.typeorm-repository';
import { ReportOrmEntity } from '../../../src/infrastructure/database/typeorm/entities/report.orm-entity';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';

const DEFAULT_LOCATION = {
  street: 'Main St',
  number: '100',
  neighborhood: 'Downtown',
  city: 'Springfield',
  state: 'IL',
  postcode: '62701',
};

function buildSavedEntity(overrides: Partial<ReportOrmEntity> = {}): ReportOrmEntity {
  const saved = new ReportOrmEntity();
  saved.id = overrides.id ?? 'uuid-1';
  saved.title = overrides.title ?? 'Pothole';
  saved.description = overrides.description ?? 'Deep pothole near bus stop';
  saved.location = overrides.location ?? DEFAULT_LOCATION;
  saved.classificationStatus = overrides.classificationStatus ?? 'PENDING';
  saved.classificationAttempts = overrides.classificationAttempts ?? 0;
  saved.lastClassificationError = overrides.lastClassificationError ?? null;
  saved.createdAt = overrides.createdAt ?? new Date();
  return saved;
}

describe('ReportTypeOrmRepository', () => {
  it('maps and saves a report with PENDING status', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ReportOrmEntity) =>
        buildSavedEntity({
          title: entity.title,
          description: entity.description,
          location: entity.location,
        }),
      ),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);

    const report = Report.create({
      title: 'Pothole',
      description: 'Deep pothole near bus stop',
      location: Location.create(DEFAULT_LOCATION),
    });

    const saved = await repo.save(report);

    expect(saved.getId()).toBe('uuid-1');
    expect(saved.getTitle()).toBe('Pothole');
    expect(saved.getLocation().getValue().street).toBe('Main St');
    expect(saved.getClassificationStatus()).toBe(ClassificationStatus.PENDING);
    expect(ormRepo.save).toHaveBeenCalledOnce();
  });

  it('maps and saves a report with DONE status', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ReportOrmEntity) =>
        buildSavedEntity({
          id: 'uuid-2',
          title: entity.title,
          description: entity.description,
          location: entity.location,
          classificationStatus: entity.classificationStatus,
        }),
      ),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);

    const report = Report.create({
      title: 'Broken streetlight',
      description: 'Streetlight not working for 3 days',
      location: Location.create({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01001-000',
      }),
    });

    report.startClassification();
    report.completeClassification();

    const saved = await repo.save(report);

    expect(saved.getId()).toBe('uuid-2');
    expect(saved.getClassificationStatus()).toBe(ClassificationStatus.DONE);

    const savedEntity = (ormRepo.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ReportOrmEntity;
    expect(savedEntity.classificationStatus).toBe('DONE');
  });

  it('persists classification status and error metadata', async () => {
    const ormRepo = {
      save: vi.fn(async (entity: ReportOrmEntity) =>
        buildSavedEntity({
          title: entity.title,
          description: entity.description,
          location: entity.location,
          classificationStatus: entity.classificationStatus,
          classificationAttempts: entity.classificationAttempts,
          lastClassificationError: entity.lastClassificationError,
        }),
      ),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);

    const report = Report.create({
      title: 'Test report',
      description: 'Test description',
      location: Location.create({
        street: 'Test St',
        number: '1',
        neighborhood: 'Test',
        city: 'Test City',
        state: 'TC',
        postcode: '00000-000',
      }),
    });

    report.startClassification();
    report.failClassification('AI timeout', 2);

    const saved = await repo.save(report);

    expect(saved.getClassificationStatus()).toBe(ClassificationStatus.FAILED);
    expect(saved.getClassificationAttempts()).toBe(2);
    expect(saved.getLastClassificationError()).toBe('AI timeout');
  });

  it('findById returns a domain report when found', async () => {
    const ormRepo = {
      findOneBy: vi.fn(async () =>
        buildSavedEntity({
          id: 'found-id',
          title: 'Found report',
          description: 'A found report',
          classificationStatus: 'PROCESSING',
        }),
      ),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);
    const report = await repo.findById('found-id');

    expect(report).not.toBeNull();
    expect(report!.getId()).toBe('found-id');
    expect(report!.getTitle()).toBe('Found report');
    expect(report!.getClassificationStatus()).toBe(ClassificationStatus.PROCESSING);
    expect(ormRepo.findOneBy).toHaveBeenCalledWith({ id: 'found-id' });
  });

  it('findById returns null when not found', async () => {
    const ormRepo = {
      findOneBy: vi.fn(async () => null),
    } as unknown as Repository<ReportOrmEntity>;

    const repo = new ReportTypeOrmRepository(ormRepo);
    const report = await repo.findById('non-existent');

    expect(report).toBeNull();
  });
});
