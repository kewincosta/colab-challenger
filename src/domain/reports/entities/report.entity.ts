import { Location, LocationRaw } from '../value-objects/location.value-object';
import { ReportTitle } from '../value-objects/report-title.value-object';
import { ReportDescription } from '../value-objects/report-description.value-object';

export interface AiClassification {
  readonly category: string;
  readonly newCategorySuggestion: string | null;
  readonly priority: string;
  readonly technicalSummary: string;
}

export interface ReportProps {
  title: string;
  description: string;
  location: Location;
  createdAt?: Date;
  aiClassification?: AiClassification | null;
}

export class Report {
  private id?: string;
  private readonly title: ReportTitle;
  private description: ReportDescription;
  private location: Location;
  private readonly createdAt: Date;
  private aiClassification: AiClassification | null;

  private constructor(props: ReportProps, id?: string) {
    this.id = id;
    this.title = ReportTitle.create(props.title);
    this.description = ReportDescription.create(props.description);
    this.location = props.location;
    this.createdAt = props.createdAt ?? new Date();
    this.aiClassification = props.aiClassification ?? null;
  }

  static create(props: ReportProps): Report {
    return new Report(props);
  }

  static restore(props: ReportProps, id: string): Report {
    return new Report(props, id);
  }

  updateDescription(newDescription: string): void {
    this.description = ReportDescription.create(newDescription);
  }

  moveTo(newLocation: Location): void {
    this.location = newLocation;
  }

  enrichWithAiClassification(classification: AiClassification): void {
    this.aiClassification = classification;
  }

  getId(): string | undefined {
    return this.id;
  }

  getTitle(): string {
    return this.title.getValue();
  }

  getDescription(): string {
    return this.description.getValue();
  }

  getLocation(): Location {
    return this.location;
  }

  getLocationRaw(): LocationRaw {
    return this.location.getValue();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getAiClassification(): AiClassification | null {
    return this.aiClassification;
  }
}
