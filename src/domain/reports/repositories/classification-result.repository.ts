import type { ClassificationResult } from '../entities/classification-result.entity';

export interface ClassificationResultRepository {
  save: (result: ClassificationResult) => Promise<ClassificationResult>;
  findByReportId: (reportId: string) => Promise<ClassificationResult | null>;
}
