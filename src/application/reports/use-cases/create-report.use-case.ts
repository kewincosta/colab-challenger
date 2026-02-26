import { Report } from '../../../domain/reports/entities/report.entity';
import { Location, LocationRaw } from '../../../domain/reports/value-objects/location.value-object';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';

export interface CreateReportCommand {
  title: string;
  description: string;
  location: LocationRaw;
}

export interface CreateReportResult {
  id: string | undefined;
  title: string;
  description: string;
  location: LocationRaw;
  createdAt: Date;
}

export class CreateReportUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute(command: CreateReportCommand): Promise<CreateReportResult> {
    const location = Location.create(command.location);

    const report = Report.create({
      title: command.title,
      description: command.description,
      location,
    });

    const persisted = await this.reportRepository.save(report);

    return {
      id: persisted.getId(),
      title: persisted.getTitle(),
      description: persisted.getDescription(),
      location: persisted.getLocation().getValue(),
      createdAt: persisted.getCreatedAt(),
    };
  }
}
