import type { Repository } from 'typeorm';
import type { ReportRepository } from '../../../../domain/reports/repositories/report.repository';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { Location } from '../../../../domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../../domain/reports/value-objects/classification-status.value-object';
import { ReportOrmEntity } from '../entities/report.orm-entity';

export class ReportTypeOrmRepository implements ReportRepository {
  constructor(private readonly ormRepository: Repository<ReportOrmEntity>) {}

  async save(report: Report): Promise<Report> {
    const entity = this.toOrmEntity(report);
    const saved = await this.ormRepository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Report | null> {
    const entity = await this.ormRepository.findOneBy({ id });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  private toOrmEntity(report: Report): ReportOrmEntity {
    const entity = new ReportOrmEntity();

    const id = report.getId();
    if (id) {
      entity.id = id;
    }
    entity.title = report.getTitle();
    entity.description = report.getDescription();
    entity.location = report.getLocationRaw() as unknown as Record<string, unknown>;
    entity.classificationStatus = report.getClassificationStatus();
    entity.classificationAttempts = report.getClassificationAttempts();
    entity.lastClassificationError = report.getLastClassificationError();

    return entity;
  }

  private toDomain(entity: ReportOrmEntity): Report {
    const location = Location.create(entity.location);

    return Report.restore(
      {
        title: entity.title,
        description: entity.description,
        location,
        createdAt: entity.createdAt,
        classificationStatus:
          entity.classificationStatus in ClassificationStatus
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated by `in` check above
              (entity.classificationStatus as ClassificationStatus)
            : ClassificationStatus.PENDING,
        classificationAttempts: entity.classificationAttempts,
        lastClassificationError: entity.lastClassificationError ?? null,
      },
      entity.id,
    );
  }
}
