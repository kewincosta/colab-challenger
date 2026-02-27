/**
 * AI Enrichment types for urban report classification.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/structured-output
 */

/** Increment this version whenever the AI classification prompt changes materially. */
export const PROMPT_VERSION = 'v1.0.0';

export const REPORT_CATEGORIES = [
  'Lighting',
  'Public Road',
  'Sanitation',
  'Waste',
  'Drainage',
  'Public Safety',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export interface AiClassificationResult {
  readonly category: ReportCategory;
  readonly new_category_suggestion: string | null;
  readonly priority: PriorityLevel;
  readonly technical_summary: string;
}

export interface AiEnrichmentInput {
  readonly title: string;
  readonly description: string;
  readonly location: string | Record<string, unknown>;
}
