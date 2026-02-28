/**
 * Mapper between AI classification result (snake_case, application boundary)
 * and domain AiClassification (camelCase, domain entity).
 *
 * Centralises the naming convention conversion in a single, testable function.
 */

import type { AiClassificationResult } from '../types';
import type { AiClassification } from '../../../domain/reports/entities/report.entity';

export function toAiClassification(result: AiClassificationResult): AiClassification {
  return {
    category: result.category,
    newCategorySuggestion: result.new_category_suggestion,
    priority: result.priority,
    technicalSummary: result.technical_summary,
  };
}
