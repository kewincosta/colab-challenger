import { Repository } from 'typeorm';
import { ReportRepository } from '../../../../domain/reports/repositories/report.repository';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { Location } from '../../../../domain/reports/value-objects/location.value-object';
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

    const saved = await this.ormRepository.save(entity);

    const restoredLocation = Location.create(saved.location);

    return Report.restore(
      {
        title: saved.title,
        description: saved.description,
        location: restoredLocation,
        createdAt: saved.createdAt,
        aiClassification: saved.category
          ? {
              category: saved.category,
              priority: saved.priority!,
              technicalSummary: saved.technicalSummary!,
              newCategorySuggestion: saved.newCategorySuggestion,
            }
          : null,
      },
      saved.id,
    );
  }
}
