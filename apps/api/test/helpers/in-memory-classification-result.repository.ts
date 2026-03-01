/**
 * In-memory ClassificationResultRepository for tests.
 *
 * Stores results keyed by reportId (1:0..1 relationship).
 * Uses an auto-incrementing counter to generate deterministic IDs.
 */

import { ClassificationResult } from '../../src/domain/reports/entities/classification-result.entity';
import type { ClassificationResultRepository } from '../../src/domain/reports/repositories/classification-result.repository';

export class InMemoryClassificationResultRepository implements ClassificationResultRepository {
  private counter = 0;
  public items: ClassificationResult[] = [];

  async save(result: ClassificationResult): Promise<ClassificationResult> {
    const existing = this.items.find((r) => r.getReportId() === result.getReportId());

    if (existing) {
      this.items = this.items.filter((r) => r.getReportId() !== result.getReportId());
      this.items.push(result);
      return result;
    }

    this.counter += 1;
    const restored = ClassificationResult.restore(
      {
        reportId: result.getReportId(),
        category: result.getCategory(),
        priority: result.getPriority(),
        technicalSummary: result.getTechnicalSummary(),
        triageStatus: result.getTriageStatus(),
        createdAt: result.getCreatedAt(),
        updatedAt: result.getUpdatedAt(),
      },
      `test-cr-uuid-${this.counter}`,
    );
    this.items.push(restored);
    return restored;
  }

  async findByReportId(reportId: string): Promise<ClassificationResult | null> {
    return this.items.find((r) => r.getReportId() === reportId) ?? null;
  }

  /** Utility: reset state between tests */
  clear(): void {
    this.items = [];
    this.counter = 0;
  }
}
