import { Report } from '../entities/report.entity';

export interface ReportRepository {
  save(report: Report): Promise<Report>;
}
