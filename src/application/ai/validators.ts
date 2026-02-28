/**
 * Zod validators and JSON schema derivation for AI structured output.
 *
 * These schemas define the business rules for what constitutes a valid
 * AI classification response. Used for both validation and to derive
 * the JSON schema sent to AI providers.
 *
 * Supports hierarchical taxonomy: subcategory must belong to the selected category.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/structured-output
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  REPORT_CATEGORIES,
  PRIORITY_LEVELS,
  ALL_SUBCATEGORIES,
  CATEGORY_SUBCATEGORIES,
} from './types';
import type { ReportCategory } from './types';

export const AiClassificationSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- z.enum requires mutable tuple; our readonly arrays are safe
  category: z.enum(REPORT_CATEGORIES as unknown as [string, ...string[]]),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- z.enum requires mutable tuple; our readonly arrays are safe
  subcategory: z.enum(ALL_SUBCATEGORIES as unknown as [string, ...string[]]).nullable(),
  new_category_suggestion: z
    .string()
    .max(40)
    .regex(/^[A-ZÀ-Ú][A-Za-zà-ú ]*$/v, 'Deve iniciar com maiúscula, sem pontuação ou emojis')
    .nullable(),
  priority: z.enum(PRIORITY_LEVELS),
  technical_summary: z.string().min(1).max(600),
});

/**
 * Refinements:
 * 1. category="Outros" → subcategory must be null, new_category_suggestion required.
 * 2. category!="Outros" → subcategory required and must belong to that category's list.
 * 3. category!="Outros" → new_category_suggestion must be null.
 */
export const AiClassificationSchemaRefined = AiClassificationSchema.refine(
  (data) => {
    if (data.category === 'Outros') {
      return data.subcategory === null && data.new_category_suggestion !== null;
    }
    if (data.subcategory === null) return false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- category is validated by z.enum above
    const validSubs = CATEGORY_SUBCATEGORIES[data.category as ReportCategory] as readonly string[];
    return validSubs.includes(data.subcategory) && data.new_category_suggestion === null;
  },
  {
    message:
      'Quando category="Outros": subcategory=null e new_category_suggestion obrigatório. ' +
      'Caso contrário: subcategory deve pertencer à categoria e new_category_suggestion=null.',
    path: ['subcategory'],
  },
);

/**
 * Derive a plain JSON Schema for AI provider structured output configuration.
 * We use the non-refined schema here since providers cannot enforce cross-field refinements;
 * the refinement is applied after parsing.
 */
export const aiClassificationJsonSchema = zodToJsonSchema(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Zod v4 types are incompatible with zodToJsonSchema parameter type
  AiClassificationSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
  { target: 'openApi3' },
);
