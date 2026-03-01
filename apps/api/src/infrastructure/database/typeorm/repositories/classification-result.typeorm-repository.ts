import type { Repository } from 'typeorm';
import type { ClassificationResultRepository } from '../../../../domain/reports/repositories/classification-result.repository';
import { ClassificationResult } from '../../../../domain/reports/entities/classification-result.entity';
import { TriageStatus } from '../../../../domain/reports/value-objects/triage-status.value-object';
import { ClassificationResultOrmEntity } from '../entities/classification-result.orm-entity';

export class ClassificationResultTypeOrmRepository implements ClassificationResultRepository {
  constructor(private readonly ormRepository: Repository<ClassificationResultOrmEntity>) {}

  async save(result: ClassificationResult): Promise<ClassificationResult> {
    const entity = this.toOrmEntity(result);
    const saved = await this.ormRepository.save(entity);
    return this.toDomain(saved);
  }

  async findByReportId(reportId: string): Promise<ClassificationResult | null> {
    const entity = await this.ormRepository.findOneBy({ reportId });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  private toOrmEntity(result: ClassificationResult): ClassificationResultOrmEntity {
    const entity = new ClassificationResultOrmEntity();

    const id = result.getId();
    if (id) {
      entity.id = id;
    }
    entity.reportId = result.getReportId();
    entity.category = result.getCategory();
    entity.priority = result.getPriority();
    entity.technicalSummary = result.getTechnicalSummary();
    entity.triageStatus = result.getTriageStatus();

    return entity;
  }

  private toDomain(entity: ClassificationResultOrmEntity): ClassificationResult {
    return ClassificationResult.restore(
      {
        reportId: entity.reportId,
        category: entity.category,
        priority: entity.priority,
        technicalSummary: entity.technicalSummary,
        triageStatus:
          entity.triageStatus in TriageStatus
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated by `in` check above
              (entity.triageStatus as TriageStatus)
            : TriageStatus.PENDING,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      entity.id,
    );
  }
}
