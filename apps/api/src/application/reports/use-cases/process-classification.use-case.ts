/**
 * Process Classification Use Case — executed by the BullMQ worker.
 *
 * Fetches a report by ID, runs AI classification, and persists the result
 * into a separate ClassificationResult entity.
 *
 * Designed for idempotency and retry safety:
 *   - Skips reports already in DONE status.
 *   - On failure, marks the report as FAILED and re-throws so BullMQ can retry.
 */

import type { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import type { ClassificationResultRepository } from '../../../domain/reports/repositories/classification-result.repository';
import { ClassificationResult } from '../../../domain/reports/entities/classification-result.entity';
import { ClassificationStatus } from '../../../domain/reports/value-objects/classification-status.value-object';
import type { ClassifyReportPort } from '../../ports/classify-report.port';
import type { AppLoggerPort } from '../../ports/logger.port';
import { toMappedClassification } from '../../ai/mappers/classification.mapper';

export interface ProcessClassificationCommand {
  readonly reportId: string;
  readonly attemptsMade: number;
}

export class ProcessClassificationUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly classificationResultRepository: ClassificationResultRepository,
    private readonly classifyReport: ClassifyReportPort,
    private readonly logger: AppLoggerPort,
  ) {}

  async execute(command: ProcessClassificationCommand): Promise<void> {
    const { reportId, attemptsMade } = command;

    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      this.logger.warn(`[ProcessClassification] Report ${reportId} not found, skipping`);
      return;
    }

    // Idempotency: skip if already classified
    if (report.getClassificationStatus() === ClassificationStatus.DONE) {
      this.logger.log(`[ProcessClassification] Report ${reportId} already classified, skipping`);
      return;
    }

    report.startClassification();
    await this.reportRepository.save(report);

    try {
      const result = await this.classifyReport.execute({
        title: report.getTitle(),
        description: report.getDescription(),
        location: report.getLocationRaw() as Record<string, unknown>,
      });

      const mapped = toMappedClassification(result);

      // Persist classification result as a separate entity
      await this.classificationResultRepository.save(
        ClassificationResult.create({
          reportId,
          category: mapped.category,
          priority: mapped.priority,
          technicalSummary: mapped.technicalSummary,
        }),
      );

      // Mark report as DONE
      report.completeClassification();
      await this.reportRepository.save(report);

      this.logger.log(
        `[ProcessClassification] Report ${reportId} classified: category=${result.category}, priority=${result.priority}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      report.failClassification(message, attemptsMade);
      await this.reportRepository.save(report);

      this.logger.error(
        `[ProcessClassification] Report ${reportId} classification failed (attempt ${attemptsMade}): ${message}`,
      );

      // Re-throw so BullMQ triggers retry with backoff
      throw error;
    }
  }
}
