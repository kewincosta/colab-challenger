import { Repository } from 'typeorm';
import { ReportRepository } from '../../../../domain/reports/repositories/report.repository';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { Location } from '../../../../domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../../domain/reports/value-objects/classification-status.value-object';
import { ReportOrmEntity } from '../entities/report.orm-entity';

export class ReportTypeOrmRepository implements ReportRepository {
  constructor(private readonly ormRepository: Repository<ReportOrmEntity>) {}

  async save(report: Report): Promise<Report> {
    const entity = new ReportOrmEntity();
    const location = report.getLocationRaw();

    if (report.getId()) {
      entity.id = report.getId() as string;
    }
    entity.title = report.getTitle();
    entity.description = report.getDescription();
    entity.location = location;

    const aiClassification = report.getAiClassification();
    entity.category = aiClassification?.category ?? null;
    entity.priority = aiClassification?.priority ?? null;
    entity.technicalSummary = aiClassification?.technicalSummary ?? null;
    entity.newCategorySuggestion = aiClassification?.newCategorySuggestion ?? null;

    entity.classificationStatus = report.getClassificationStatus();
    entity.classificationAttempts = report.getClassificationAttempts();
    entity.lastClassificationError = report.getLastClassificationError();
    entity.classifiedAt = report.getClassifiedAt();

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
                priority: entity.priority,
                technicalSummary: entity.technicalSummary,
                newCategorySuggestion: entity.newCategorySuggestion ?? null,
              }
            : null,
        classificationStatus:
          (entity.classificationStatus as ClassificationStatus) ?? ClassificationStatus.PENDING,
        classificationAttempts: entity.classificationAttempts ?? 0,
        lastClassificationError: entity.lastClassificationError ?? null,
        classifiedAt: entity.classifiedAt ?? null,
      },
      entity.id,
    );
  }
}
