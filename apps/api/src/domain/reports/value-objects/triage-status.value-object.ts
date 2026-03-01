/**
 * Triage status for human review of AI classification results.
 *
 * Represents the lifecycle of the manual review process:
 *   PENDING → (future: REVIEWED → APPROVED | REJECTED)
 *
 * Currently always PENDING — exists to avoid a costly migration
 * when manual triage is introduced.
 */
export enum TriageStatus {
  PENDING = 'PENDING',
}
