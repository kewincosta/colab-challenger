/**
 * Mapper between AI classification result (snake_case, application boundary)
 * and ClassificationResult entity props (camelCase, domain entity).
 *
 * Centralises the naming convention conversion in a single, testable function.
 */

import type { AiClassificationResult } from '../types';

export interface MappedClassification {
  readonly category: string;
  readonly priority: string;
  readonly technicalSummary: string;
}

export function toMappedClassification(result: AiClassificationResult): MappedClassification {
  return {
    category: result.category,
    priority: result.priority,
    technicalSummary: result.technical_summary,
  };
}
