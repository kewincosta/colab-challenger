/**
 * Zod schemas for the Create Report endpoint.
 *
 * Single source of truth for validation AND TypeScript types.
 * Replaces class-validator decorators — same rules, better type inference.
 */

import { z } from 'zod';

export const structuredLocationSchema = z
  .object({
    street: z.string().min(1),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postcode: z.string().min(1),
  })
  .strict();

export const createReportSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    location: structuredLocationSchema,
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type StructuredLocationInput = z.infer<typeof structuredLocationSchema>;
