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
    entity.location = report.getLocationRaw();

    Object.assign(entity, this.extractClassificationFields(report));

    return entity;
  }

  private extractClassificationFields(
    report: Report,
  ): Pick<
    ReportOrmEntity,
    | 'category'
    | 'subcategory'
    | 'priority'
    | 'technicalSummary'
    | 'newCategorySuggestion'
    | 'classificationStatus'
    | 'classificationAttempts'
    | 'lastClassificationError'
    | 'classifiedAt'
  > {
    const ai = report.getAiClassification();
    const hasAi = ai !== null;
    return {
      category: hasAi ? ai.category : null,
      subcategory: hasAi ? ai.subcategory : null,
      priority: hasAi ? ai.priority : null,
      technicalSummary: hasAi ? ai.technicalSummary : null,
      newCategorySuggestion: hasAi ? ai.newCategorySuggestion : null,
      classificationStatus: report.getClassificationStatus(),
      classificationAttempts: report.getClassificationAttempts(),
      lastClassificationError: report.getLastClassificationError(),
      classifiedAt: report.getClassifiedAt(),
    };
  }

  private toDomain(entity: ReportOrmEntity): Report {
    const location = Location.create(entity.location);

    return Report.restore(
      {
        title: entity.title,
        description: entity.description,
        location,
        createdAt: entity.createdAt,
        aiClassification:
          entity.category && entity.priority && entity.technicalSummary
            ? {
                category: entity.category,
                subcategory: entity.subcategory,
                priority: entity.priority,
                technicalSummary: entity.technicalSummary,
                newCategorySuggestion: entity.newCategorySuggestion ?? null,
              }
            : null,
        classificationStatus:
          entity.classificationStatus in ClassificationStatus
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated by `in` check above
              (entity.classificationStatus as ClassificationStatus)
            : ClassificationStatus.PENDING,
        classificationAttempts: entity.classificationAttempts,
        lastClassificationError: entity.lastClassificationError ?? null,
        classifiedAt: entity.classifiedAt ?? null,
      },
      entity.id,
    );
  }
}
