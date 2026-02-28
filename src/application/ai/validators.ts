/**
 * Zod validators and JSON schema derivation for AI structured output.
 *
 * These schemas define the business rules for what constitutes a valid
 * AI classification response. Used for both validation and to derive
 * the JSON schema sent to AI providers.
 *
 * Output only: category, priority, technical_summary.
 * Subcategories are used in the prompt for bottom-up reasoning but are NOT
 * part of the AI output contract.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/structured-output
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { REPORT_CATEGORIES, PRIORITY_LEVELS } from './types';

export const AiClassificationSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- z.enum requires mutable tuple; our readonly arrays are safe
  category: z.enum(REPORT_CATEGORIES as unknown as [string, ...string[]]),
  priority: z.enum(PRIORITY_LEVELS),
  technical_summary: z.string().min(1).max(600),
});

/**
 * Derive a plain JSON Schema for AI provider structured output configuration.
 */
export const aiClassificationJsonSchema = zodToJsonSchema(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Zod v4 types are incompatible with zodToJsonSchema parameter type
  AiClassificationSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
  { target: 'openApi3' },
);
