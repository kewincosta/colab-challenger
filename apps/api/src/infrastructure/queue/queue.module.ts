/**
 * Classification Queue Module — BullMQ infrastructure for async report classification.
 *
 * Registers:
 *   - The report-classification queue with retry/backoff defaults
 *   - ClassificationProducer (implements QueueProducerPort)
 *   - ClassificationProcessor (BullMQ worker, concurrency: 3)
 *   - ProcessClassificationUseCase (application logic consumed by the worker)
 *
 * Exports QUEUE_PRODUCER_TOKEN so other modules (e.g., ReportsModule)
 * can publish classification jobs.
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { REPORT_CLASSIFICATION_QUEUE } from './constants';
import { ClassificationProducer } from './classification.producer';
import { ClassificationProcessor } from './classification.processor';

import { ProcessClassificationUseCase } from '../../application/reports/use-cases/process-classification.use-case';
import type { ReportRepository } from '../../domain/reports/repositories/report.repository';
import type { ClassificationResultRepository } from '../../domain/reports/repositories/classification-result.repository';
import type { ClassifyReportPort } from '../../application/ports/classify-report.port';
import type { AppLoggerPort } from '../../application/ports/logger.port';

import { ReportOrmEntity } from '../database/typeorm/entities/report.orm-entity';
import { ClassificationResultOrmEntity } from '../database/typeorm/entities/classification-result.orm-entity';
import { ReportTypeOrmRepository } from '../database/typeorm/repositories/report.typeorm-repository';
import { ClassificationResultTypeOrmRepository } from '../database/typeorm/repositories/classification-result.typeorm-repository';
import { AiModule } from '../ai/ai.module';

import {
  REPORT_REPOSITORY_TOKEN,
  CLASSIFICATION_RESULT_REPOSITORY_TOKEN,
  APP_LOGGER_TOKEN,
  AI_CLASSIFICATION_SERVICE_TOKEN,
  QUEUE_PRODUCER_TOKEN,
} from '../../shared/constants/tokens';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REPORT_CLASSIFICATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([ReportOrmEntity, ClassificationResultOrmEntity]),
    AiModule,
  ],
  providers: [
    {
      provide: REPORT_REPOSITORY_TOKEN,
      useFactory: (repo: Repository<ReportOrmEntity>): ReportRepository =>
        new ReportTypeOrmRepository(repo),
      inject: [getRepositoryToken(ReportOrmEntity)],
    },
    {
      provide: CLASSIFICATION_RESULT_REPOSITORY_TOKEN,
      useFactory: (
        repo: Repository<ClassificationResultOrmEntity>,
      ): ClassificationResultRepository => new ClassificationResultTypeOrmRepository(repo),
      inject: [getRepositoryToken(ClassificationResultOrmEntity)],
    },
    {
      provide: ProcessClassificationUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        classificationResultRepository: ClassificationResultRepository,
        classifyReport: ClassifyReportPort,
        logger: AppLoggerPort,
      ) =>
        new ProcessClassificationUseCase(
          reportRepository,
          classificationResultRepository,
          classifyReport,
          logger,
        ),
      inject: [
        REPORT_REPOSITORY_TOKEN,
        CLASSIFICATION_RESULT_REPOSITORY_TOKEN,
        AI_CLASSIFICATION_SERVICE_TOKEN,
        APP_LOGGER_TOKEN,
      ],
    },
    {
      provide: QUEUE_PRODUCER_TOKEN,
      useClass: ClassificationProducer,
    },
    ClassificationProcessor,
  ],
  exports: [QUEUE_PRODUCER_TOKEN],
})
export class ClassificationQueueModule {}
