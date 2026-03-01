import type { Repository } from 'typeorm';
import type { ClassificationResultRepository } from '../../../../domain/reports/repositories/classification-result.repository';
import { ClassificationResult } from '../../../../domain/reports/entities/classification-result.entity';
import { TriageStatus } from '../../../../domain/reports/value-objects/triage-status.value-object';
import { ClassificationResultOrmEntity } from '../entities/classification-result.orm-entity';

export class ClassificationResultTypeOrmRepository implements ClassificationResultRepository {
  constructor(private readonly ormRepository: Repository<ClassificationResultOrmEntity>) {}

  async save(result: ClassificationResult): Promise<ClassificationResult> {
    const entity = await this.toOrmEntity(result);
    const saved = await this.ormRepository.save(entity);
    return this.toDomain(saved);
  }

  async findByReportId(reportId: string): Promise<ClassificationResult | null> {
    const entity = await this.ormRepository.findOneBy({ reportExternalId: reportId });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  private async toOrmEntity(result: ClassificationResult): Promise<ClassificationResultOrmEntity> {
    const entity = new ClassificationResultOrmEntity();

    const domainId = result.getId();
    if (domainId) {
      const existing = await this.ormRepository.findOneBy({ externalId: domainId });
      if (existing) {
        entity.id = existing.id;
      }
      entity.externalId = domainId;
    }

    entity.reportExternalId = result.getReportId();
    entity.category = result.getCategory();
    entity.priority = result.getPriority();
    entity.technicalSummary = result.getTechnicalSummary();
    entity.triageStatus = result.getTriageStatus();

    return entity;
  }

  private toDomain(entity: ClassificationResultOrmEntity): ClassificationResult {
    return ClassificationResult.restore(
      {
        reportId: entity.reportExternalId,
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
      entity.externalId,
    );
  }
}
