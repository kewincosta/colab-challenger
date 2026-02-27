/**
 * BullMQ producer for report classification jobs.
 *
 * Implements QueueProducerPort (application-layer abstraction)
 * using BullMQ as the concrete queue infrastructure.
 *
 * Deduplication: uses reportId as jobId (Simple Mode) —
 * duplicate jobs for the same report are ignored while one is active.
 */

import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import type { QueueProducerPort, ClassificationJobPayload } from '../../application/ports/queue-producer.port';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import { APP_LOGGER_TOKEN } from '../../shared/constants/tokens';
import { REPORT_CLASSIFICATION_QUEUE, CLASSIFY_REPORT_JOB } from './constants';

@Injectable()
export class ClassificationProducer implements QueueProducerPort {
  constructor(
    @InjectQueue(REPORT_CLASSIFICATION_QUEUE) private readonly queue: Queue,
    @Inject(APP_LOGGER_TOKEN) private readonly logger: AppLoggerPort,
  ) {}

  async publishClassificationJob(payload: ClassificationJobPayload): Promise<void> {
    await this.queue.add(CLASSIFY_REPORT_JOB, payload, {
      jobId: payload.reportId, // Simple deduplication by report ID
    });

    this.logger.log(
      `[ClassificationProducer] Job published for report ${payload.reportId}`,
    );
  }
}
