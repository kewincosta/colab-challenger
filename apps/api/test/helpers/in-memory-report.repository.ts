/**
 * In-memory ReportRepository for tests.
 *
 * Supports both insert (no ID) and update (existing ID) operations.
 * Uses an auto-incrementing counter to generate deterministic IDs.
 */

import { Report } from '../../src/domain/reports/entities/report.entity';
import type { ReportRepository } from '../../src/domain/reports/repositories/report.repository';

export class InMemoryReportRepository implements ReportRepository {
  private counter = 0;
  public items: Report[] = [];

  async save(report: Report): Promise<Report> {
    if (report.getId()) {
      this.items = this.items.filter((r) => r.getId() !== report.getId());
      this.items.push(report);
      return report;
    }

    this.counter += 1;
    const restored = Report.restore(
      {
        title: report.getTitle(),
        description: report.getDescription(),
        location: report.getLocation(),
        createdAt: report.getCreatedAt(),
        classificationStatus: report.getClassificationStatus(),
        classificationAttempts: report.getClassificationAttempts(),
        lastClassificationError: report.getLastClassificationError(),
      },
      `test-uuid-${this.counter}`,
    );
    this.items.push(restored);
    return restored;
  }

  async findById(id: string): Promise<Report | null> {
    return this.items.find((r) => r.getId() === id) ?? null;
  }

  /** Utility: reset state between tests */
  clear(): void {
    this.items = [];
    this.counter = 0;
  }
}
