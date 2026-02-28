/**
 * Port for AI content generation clients.
 *
 * The application layer depends on this abstraction.
 * Infrastructure adapters (e.g., GeminiClient) implement it.
 *
 * The port is provider-agnostic: it receives ready-to-send text
 * and an optional JSON schema for structured output. Prompt construction
 * is the responsibility of the calling use case, not the adapter.
 */

export interface AiClientPort {
  generate: (
    systemInstruction: string,
    userMessage: string,
    responseJsonSchema?: Record<string, unknown>,
  ) => Promise<string>;
}
