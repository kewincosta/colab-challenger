import { Report } from '../../../domain/reports/entities/report.entity';
import { Location, LocationRaw } from '../../../domain/reports/value-objects/location.value-object';
import { ReportRepository } from '../../../domain/reports/repositories/report.repository';
import { AppLoggerPort } from '../../ports/logger.port';
import { ClassifyReportUseCase } from '../../ai/use-cases/classify-report.use-case';

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
  category: string | null;
  priority: string | null;
  technicalSummary: string | null;
  newCategorySuggestion: string | null;
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly logger: AppLoggerPort,
    private readonly classifyReport: ClassifyReportUseCase,
  ) {}

  async execute(command: CreateReportCommand): Promise<CreateReportResult> {
    this.logger.log(`Creating report: "${command.title}"`);

    const location = Location.create(command.location);

    const report = Report.create({
      title: command.title,
      description: command.description,
      location,
    });

    // AI classification — best-effort, failures should not block report creation
    try {
      const classification = await this.classifyReport.execute({
        title: command.title,
        description: command.description,
        location: command.location,
      });

      report.enrichWithAiClassification({
        category: classification.category,
        priority: classification.priority,
        technicalSummary: classification.technical_summary,
        newCategorySuggestion: classification.new_category_suggestion,
      });

      this.logger.log(
        `AI classification: category=${classification.category}, priority=${classification.priority}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI classification failed (best-effort): ${message}`);
    }

    const persisted = await this.reportRepository.save(report);

    const id = persisted.getId();
    if (!id) {
      throw new Error('Report ID must be defined after persistence');
    }

    this.logger.log(`Report created successfully with id: ${id}`);

    const aiClassification = persisted.getAiClassification();

    return {
      id,
      title: persisted.getTitle(),
      description: persisted.getDescription(),
      location: persisted.getLocationRaw(),
      createdAt: persisted.getCreatedAt(),
      category: aiClassification?.category ?? null,
      priority: aiClassification?.priority ?? null,
      technicalSummary: aiClassification?.technicalSummary ?? null,
      newCategorySuggestion: aiClassification?.newCategorySuggestion ?? null,
    };
  }
}
