/**
 * BullMQ processor (worker) for report classification jobs.
 *
 * Consumes jobs from the report-classification queue and delegates
 * to ProcessClassificationUseCase (application layer).
 *
 * Configuration:
 *   - concurrency: 3 — conservative start, avoids Gemini rate limits
 *   - retry/backoff: configured at queue level (defaultJobOptions)
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';

import { ProcessClassificationUseCase } from '../../application/reports/use-cases/process-classification.use-case';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import { APP_LOGGER_TOKEN } from '../../shared/constants/tokens';
import { REPORT_CLASSIFICATION_QUEUE } from './constants';

interface ClassificationJobData {
  reportId: string;
}

@Processor(REPORT_CLASSIFICATION_QUEUE, { concurrency: 3 })
export class ClassificationProcessor extends WorkerHost {
  constructor(
    private readonly processClassification: ProcessClassificationUseCase,
    @Inject(APP_LOGGER_TOKEN) private readonly logger: AppLoggerPort,
  ) {
    super();
  }

  async process(job: Job<ClassificationJobData>): Promise<void> {
    const { reportId } = job.data;

    this.logger.log(
      `[ClassificationProcessor] Processing job ${job.id} for report ${reportId} (attempt ${job.attemptsMade + 1})`,
    );

    await this.processClassification.execute({
      reportId,
      attemptsMade: job.attemptsMade + 1,
    });
  }
}
