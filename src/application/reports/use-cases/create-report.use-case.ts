import { Report } from '../../../domain/reports/entities/report.entity';
import { Location, LocationRaw } from '../../../domain/reports/value-objects/location.value-object';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import { AppLoggerPort } from '../../ports/logger.port';

export interface CreateReportCommand {
  title: string;
  description: string;
  location: LocationRaw;
}

export interface CreateReportResult {
  id: string;
  title: string;
  description: string;
  location: LocationRaw;
  createdAt: Date;
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly logger: AppLoggerPort,
  ) {}

  async execute(command: CreateReportCommand): Promise<CreateReportResult> {
    this.logger.log(`Creating report: "${command.title}"`);

    const location = Location.create(command.location);

    const report = Report.create({
      title: command.title,
      description: command.description,
      location,
    });

    const persisted = await this.reportRepository.save(report);

    const id = persisted.getId();
    if (!id) {
      throw new Error('Report ID must be defined after persistence');
    }

    this.logger.log(`Report created successfully with id: ${id}`);

    return {
      id,
      title: persisted.getTitle(),
      description: persisted.getDescription(),
      location: persisted.getLocationRaw(),
      createdAt: persisted.getCreatedAt(),
    };
  }
}
