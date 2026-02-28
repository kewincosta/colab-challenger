import { Report } from '../../../domain/reports/entities/report.entity';
import {
  Location,
  type LocationRaw,
} from '../../../domain/reports/value-objects/location.value-object';
import type { ClassificationStatus } from '../../../domain/reports/value-objects/classification-status.value-object';
import type { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import type { AppLoggerPort } from '../../ports/logger.port';
import type { QueueProducerPort } from '../../ports/queue-producer.port';
import type { ClockPort } from '../../ports/clock.port';

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
  classificationStatus: ClassificationStatus;
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly logger: AppLoggerPort,
    private readonly queueProducer: QueueProducerPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: CreateReportCommand): Promise<CreateReportResult> {
    this.logger.log(`Creating report: "${command.title}"`);

    const location = Location.create(command.location);

    const report = Report.create({
      title: command.title,
      description: command.description,
      location,
      createdAt: this.clock.now(),
    });

    const persisted = await this.reportRepository.save(report);

    const id = persisted.getId();
    if (!id) {
      throw new Error('Report ID must be defined after persistence');
    }

    await this.queueProducer.publishClassificationJob({ reportId: id });

    this.logger.log(`Report ${id} created, classification job published`);

    return {
      id,
      title: persisted.getTitle(),
      description: persisted.getDescription(),
      location: persisted.getLocationRaw(),
      createdAt: persisted.getCreatedAt(),
      classificationStatus: persisted.getClassificationStatus(),
    };
  }
}
