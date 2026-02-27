import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { CreateReportUseCase } from '../../../application/reports/use-cases/create-report.use-case';
import { ReportOrmEntity } from '../../../infrastructure/database/typeorm/entities/report.orm-entity';
import { ReportTypeOrmRepository } from '../../../infrastructure/database/typeorm/repositories/report.typeorm-repository';
import { ClassificationQueueModule } from '../../../infrastructure/queue/queue.module';
import {
  REPORT_REPOSITORY_TOKEN,
  APP_LOGGER_TOKEN,
  CLOCK_TOKEN,
  QUEUE_PRODUCER_TOKEN,
} from '../../../shared/constants/tokens';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import { AppLoggerPort } from '../../../application/ports/logger.port';
import { QueueProducerPort } from '../../../application/ports/queue-producer.port';
import { ClockPort } from '../../../application/ports/clock.port';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ReportOrmEntity]), ClassificationQueueModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: CLOCK_TOKEN,
      useValue: { now: () => new Date() } satisfies ClockPort,
    },
    {
      provide: REPORT_REPOSITORY_TOKEN,
      useFactory: (repo: Repository<ReportOrmEntity>): ReportRepository =>
        new ReportTypeOrmRepository(repo),
      inject: [getRepositoryToken(ReportOrmEntity)],
    },
    {
      provide: CreateReportUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        logger: AppLoggerPort,
        queueProducer: QueueProducerPort,
        clock: ClockPort,
      ) => new CreateReportUseCase(reportRepository, logger, queueProducer, clock),
      inject: [REPORT_REPOSITORY_TOKEN, APP_LOGGER_TOKEN, QUEUE_PRODUCER_TOKEN, CLOCK_TOKEN],
    },
  ],
})
export class ReportsModule {}
