import type { Location, StructuredLocation } from '../value-objects/location.value-object';
import { ReportTitle } from '../value-objects/report-title.value-object';
import { ReportDescription } from '../value-objects/report-description.value-object';
import { ClassificationStatus } from '../value-objects/classification-status.value-object';

export interface ReportProps {
  title: string;
  description: string;
  location: Location;
  createdAt?: Date;
  classificationStatus?: ClassificationStatus;
  classificationAttempts?: number;
  lastClassificationError?: string | null;
}

export class Report {
  private readonly id?: string;
  private readonly title: ReportTitle;
  private description: ReportDescription;
  private location: Location;
  private readonly createdAt: Date;
  private classificationStatus: ClassificationStatus;
  private classificationAttempts: number;
  private lastClassificationError: string | null;

  private constructor(props: ReportProps, id?: string) {
    this.id = id;
    this.title = ReportTitle.create(props.title);
    this.description = ReportDescription.create(props.description);
    this.location = props.location;
    this.createdAt = props.createdAt ?? new Date();
    this.classificationStatus = props.classificationStatus ?? ClassificationStatus.PENDING;
    this.classificationAttempts = props.classificationAttempts ?? 0;
    this.lastClassificationError = props.lastClassificationError ?? null;
  }

  static create(props: ReportProps): Report {
    return new Report(props);
  }

  static restore(props: ReportProps, id: string): Report {
    return new Report(props, id);
  }

  // ── Mutation methods ────────────────────────────────────────────────

  updateDescription(newDescription: string): void {
    this.description = ReportDescription.create(newDescription);
  }

  moveTo(newLocation: Location): void {
    this.location = newLocation;
  }

  // ── Classification lifecycle ────────────────────────────────────────

  /**
   * Transition to PROCESSING. Idempotent: no-op if already DONE.
   * Allows PENDING → PROCESSING and FAILED → PROCESSING (retry).
   */
  startClassification(): void {
    if (this.classificationStatus === ClassificationStatus.DONE) {
      return;
    }
    this.classificationStatus = ClassificationStatus.PROCESSING;
  }

  /**
   * Mark classification as successfully completed.
   * Sets status to DONE.
   */
  completeClassification(): void {
    this.classificationStatus = ClassificationStatus.DONE;
  }

  /**
   * Mark classification as failed.
   * Records the error message and number of attempts made.
   */
  failClassification(error: string, attempts: number): void {
    this.classificationStatus = ClassificationStatus.FAILED;
    this.lastClassificationError = error;
    this.classificationAttempts = attempts;
  }

  // ── Getters ─────────────────────────────────────────────────────────

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

  getLocationRaw(): StructuredLocation {
    return this.location.getValue();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getClassificationStatus(): ClassificationStatus {
    return this.classificationStatus;
  }

  getClassificationAttempts(): number {
    return this.classificationAttempts;
  }

  getLastClassificationError(): string | null {
    return this.lastClassificationError;
  }
}
