/**
 * ClassificationResult entity — stores the output of AI classification.
 *
 * Separated from Report to keep a clean boundary between input data
 * (report) and AI-generated output (classification result). This entity
 * is created only when classification succeeds.
 *
 * The `triageStatus` field defaults to PENDING and exists to enable
 * a future manual review workflow without schema changes.
 */

import { TriageStatus } from '../value-objects/triage-status.value-object';

export interface ClassificationResultProps {
  readonly reportId: string;
  readonly category: string;
  readonly priority: string;
  readonly technicalSummary: string;
  readonly triageStatus?: TriageStatus;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export class ClassificationResult {
  private readonly id?: string;
  private readonly reportId: string;
  private readonly category: string;
  private readonly priority: string;
  private readonly technicalSummary: string;
  private readonly triageStatus: TriageStatus;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(props: ClassificationResultProps, id?: string) {
    this.id = id;
    this.reportId = props.reportId;
    this.category = props.category;
    this.priority = props.priority;
    this.technicalSummary = props.technicalSummary;
    this.triageStatus = props.triageStatus ?? TriageStatus.PENDING;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Create a new ClassificationResult (no ID yet — assigned by persistence).
   */
  static create(props: ClassificationResultProps): ClassificationResult {
    return new ClassificationResult(props);
  }

  /**
   * Restore a ClassificationResult from persistence (has ID).
   */
  static restore(props: ClassificationResultProps, id: string): ClassificationResult {
    return new ClassificationResult(props, id);
  }

  // ── Getters ─────────────────────────────────────────────────────────

  getId(): string | undefined {
    return this.id;
  }

  getReportId(): string {
    return this.reportId;
  }

  getCategory(): string {
    return this.category;
  }

  getPriority(): string {
    return this.priority;
  }

  getTechnicalSummary(): string {
    return this.technicalSummary;
  }

  getTriageStatus(): TriageStatus {
    return this.triageStatus;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
