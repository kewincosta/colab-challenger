/**
 * Port for AI-based report classification.
 *
 * The application layer depends on this abstraction.
 * ClassifyReportUseCase implements it; CreateReportUseCase consumes it.
 */

import type { AiClassificationResult, AiEnrichmentInput } from '../ai/types';

export interface ClassifyReportPort {
  execute(input: AiEnrichmentInput): Promise<AiClassificationResult>;
}
