/**
 * Zod validators and JSON schema derivation for AI structured output.
 *
 * These schemas define the business rules for what constitutes a valid
 * AI classification response. Used for both validation and to derive
 * the JSON schema sent to AI providers.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/structured-output
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { REPORT_CATEGORIES, PRIORITY_LEVELS } from './types';

export const AiClassificationSchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  new_category_suggestion: z
    .string()
    .max(40)
    .regex(/^[A-Z][A-Za-z ]*$/, 'Must be Title Case, no punctuation or emojis')
    .nullable(),
  priority: z.enum(PRIORITY_LEVELS),
  technical_summary: z
    .string()
    .min(1)
    .max(600),
});

/**
 * Refine: if category is "Other", new_category_suggestion is required.
 * If category is NOT "Other", new_category_suggestion must be null.
 */
export const AiClassificationSchemaRefined = AiClassificationSchema.refine(
  (data) => {
    if (data.category === 'Other') return data.new_category_suggestion !== null;
    return data.new_category_suggestion === null;
  },
  {
    message:
      'new_category_suggestion is required when category is "Other" and must be null otherwise',
    path: ['new_category_suggestion'],
  },
);

/**
 * Derive a plain JSON Schema for AI provider structured output configuration.
 * We use the non-refined schema here since providers cannot enforce cross-field refinements;
 * the refinement is applied after parsing.
 */
export const aiClassificationJsonSchema = zodToJsonSchema(
  AiClassificationSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
  { target: 'openApi3' },
);
