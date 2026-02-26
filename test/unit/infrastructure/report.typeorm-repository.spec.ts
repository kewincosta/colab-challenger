import { Repository } from 'typeorm';
import { ReportTypeOrmRepository } from '../../../src/infrastructure/database/typeorm/repositories/report.typeorm-repository';
import { ReportOrmEntity } from '../../../src/infrastructure/database/typeorm/entities/report.orm-entity';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';

describe('ReportTypeOrmRepository', () => {
  it('maps and saves a report via TypeORM repository', async () => {
    const ormRepo = {
      save: jest.fn(async (entity: ReportOrmEntity) => {
        const saved = new ReportOrmEntity();
        saved.id = 'uuid-1';
        saved.title = entity.title;
        saved.description = entity.description;
        saved.location = entity.location;
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
    expect((ormRepo as unknown as { save: jest.Mock }).save.mock.calls.length).toBe(1);
  });
});
