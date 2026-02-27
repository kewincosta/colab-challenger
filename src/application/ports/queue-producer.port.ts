/**
 * Port for publishing classification jobs to a background queue.
 *
 * The application layer depends on this abstraction (DIP).
 * Infrastructure implements it with BullMQ.
 */

export interface ClassificationJobPayload {
  readonly reportId: string;
}

export interface QueueProducerPort {
  publishClassificationJob(payload: ClassificationJobPayload): Promise<void>;
}
