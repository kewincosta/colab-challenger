/**
 * Classification status for AI-based report classification.
 *
 * Represents the lifecycle of the background classification process:
 *   PENDING → PROCESSING → DONE | FAILED
 *
 * FAILED is not terminal from a retry perspective: BullMQ may retry
 * the job, transitioning FAILED → PROCESSING again.
 */
export enum ClassificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}
