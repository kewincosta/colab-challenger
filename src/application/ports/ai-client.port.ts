/**
 * Port for AI classification clients.
 *
 * The application layer depends on this abstraction.
 * Infrastructure adapters (e.g., GeminiClient) implement it.
 */

import type { AiEnrichmentInput } from '../ai/types';

export interface AiClientPort {
  classify: (input: AiEnrichmentInput) => Promise<string>;
  repair: (input: AiEnrichmentInput, previousRaw: string, error: string) => Promise<string>;
}
