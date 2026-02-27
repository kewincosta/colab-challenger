/**
 * Gemini API client wrapper for structured content generation.
 *
 * Implements AiClientPort, keeping Gemini-specific details isolated
 * in the infrastructure layer.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs?hl=pt-br#javascript
 * - https://ai.google.dev/gemini-api/docs/models?hl=pt-br
 * - https://ai.google.dev/gemini-api/docs/structured-output
 * - https://ai.google.dev/gemini-api/docs/safety-settings
 */

import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai';
import type {
  GenerateContentResponse,
  SafetySetting,
} from '@google/genai';
import { ConfigService } from '@nestjs/config';

import type { AiClientPort } from '../../application/ports/ai-client.port';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import type { AiEnrichmentInput } from '../../application/ai/types';
import type { EnvConfig } from '../../shared/config/env.validation';
import { aiClassificationJsonSchema } from '../../application/ai/validators';
import {
  AiSafetyBlockedError,
  AiTimeoutError,
  AiInvalidJsonError,
} from '../../application/ai/errors';
import {
  buildSystemInstruction,
  buildUserMessage,
  buildRepairMessage,
} from './prompt-builder';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_TIMEOUT_MS = 30_000;

export class GeminiClient implements AiClientPort {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly logger: AppLoggerPort,
  ) {
    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });

    this.client = new GoogleGenAI({ apiKey });
    this.model = this.config.get('GEMINI_MODEL', { infer: true }) ?? DEFAULT_MODEL;
    this.timeoutMs =
      this.config.get('GEMINI_TIMEOUT_MS', { infer: true }) ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Call Gemini with structured output mode and return the raw JSON string.
   */
  async classify(input: AiEnrichmentInput): Promise<string> {
    const systemInstruction = buildSystemInstruction();
    const userMessage = buildUserMessage(input);

    return this.callGemini(systemInstruction, userMessage);
  }

  /**
   * Retry with a repair prompt when the initial response was invalid.
   */
  async repair(
    input: AiEnrichmentInput,
    previousRaw: string,
    error: string,
  ): Promise<string> {
    const systemInstruction = buildSystemInstruction();
    const repairMessage = buildRepairMessage(previousRaw, error);

    this.logger.warn(
      `[GeminiClient] Attempting repair retry for input: "${input.title}"`,
    );

    return this.callGemini(systemInstruction, repairMessage);
  }

  private async callGemini(
    systemInstruction: string,
    userMessage: string,
  ): Promise<string> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response: GenerateContentResponse =
        await this.client.models.generateContent({
          model: this.model,
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0,
            topP: 1,
            topK: 1,
            candidateCount: 1,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            responseJsonSchema: aiClassificationJsonSchema,
            safetySettings: this.buildSafetySettings(),
            abortSignal: abortController.signal,
          },
        });

      this.checkSafetyBlock(response);

      const text = response.text;
      if (!text) {
        throw new AiInvalidJsonError('', 'Empty response text from Gemini');
      }

      this.logger.log(
        `[GeminiClient] Received response (${text.length} chars)`,
      );

      return text;
    } catch (err: unknown) {
      if (err instanceof AiSafetyBlockedError) throw err;
      if (err instanceof AiInvalidJsonError) throw err;

      if (
        err instanceof DOMException ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        throw new AiTimeoutError(this.timeoutMs);
      }

      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Build safety settings appropriate for a government-facing application.
   * Block medium-and-above for all harm categories.
   *
   * Reference: https://ai.google.dev/gemini-api/docs/safety-settings
   */
  private buildSafetySettings(): SafetySetting[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Check if the response was blocked by safety filters.
   */
  private checkSafetyBlock(response: GenerateContentResponse): void {
    const promptFeedback = response.promptFeedback;
    if (promptFeedback?.blockReason) {
      const reason =
        promptFeedback.blockReasonMessage ??
        promptFeedback.blockReason ??
        'UNKNOWN';

      this.logger.error(
        `[GeminiClient] Response blocked by safety filter: ${reason}`,
      );
      throw new AiSafetyBlockedError(String(reason));
    }

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      const ratings = candidate.safetyRatings
        ?.filter((r) => r.blocked)
        .map((r) => `${r.category}:${r.probability}`)
        .join(', ');

      const reason = ratings || 'SAFETY (no details)';
      this.logger.error(
        `[GeminiClient] Candidate blocked by safety filter: ${reason}`,
      );
      throw new AiSafetyBlockedError(reason);
    }
  }
}
