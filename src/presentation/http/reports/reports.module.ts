import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { CreateReportUseCase } from '../../../application/reports/use-cases/create-report.use-case';
import { ClassifyReportUseCase } from '../../../application/ai/use-cases/classify-report.use-case';
import { ReportOrmEntity } from '../../../infrastructure/database/typeorm/entities/report.orm-entity';
import { ReportTypeOrmRepository } from '../../../infrastructure/database/typeorm/repositories/report.typeorm-repository';
import {
  REPORT_REPOSITORY_TOKEN,
  APP_LOGGER_TOKEN,
  AI_ENRICHMENT_SERVICE_TOKEN,
} from '../../../shared/constants/tokens';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import { AppLogger } from '../../../shared/logger/app-logger.service';
import { AppLoggerPort } from '../../../application/ports/logger.port';
import { AiModule } from '../../../infrastructure/ai/ai.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ReportOrmEntity]), AiModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: APP_LOGGER_TOKEN,
      useClass: AppLogger,
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
        classifyReport: ClassifyReportUseCase,
      ) => new CreateReportUseCase(reportRepository, logger, classifyReport),
      inject: [REPORT_REPOSITORY_TOKEN, APP_LOGGER_TOKEN, AI_ENRICHMENT_SERVICE_TOKEN],
    },
  ],
})
export class ReportsModule {}
