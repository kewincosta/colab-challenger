import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { CreateReportUseCase } from '../../../application/reports/use-cases/create-report.use-case';
import { ReportOrmEntity } from '../../../infrastructure/database/typeorm/entities/report.orm-entity';
import { ReportTypeOrmRepository } from '../../../infrastructure/database/typeorm/repositories/report.typeorm-repository';
import { REPORT_REPOSITORY_TOKEN } from '../../../shared/constants/tokens';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ReportOrmEntity])],
  controllers: [ReportsController],
  providers: [
    {
      provide: REPORT_REPOSITORY_TOKEN,
      useFactory: (repo: Repository<ReportOrmEntity>): ReportRepository =>
        new ReportTypeOrmRepository(repo),
      inject: [getRepositoryToken(ReportOrmEntity)],
    },
    {
      provide: CreateReportUseCase,
      useFactory: (reportRepository: ReportRepository) =>
        new CreateReportUseCase(reportRepository),
      inject: [REPORT_REPOSITORY_TOKEN],
    },
  ],
})
export class ReportsModule {}
