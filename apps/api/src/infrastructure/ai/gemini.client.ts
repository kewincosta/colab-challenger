/**
 * Gemini API client wrapper for structured content generation.
 *
 * Implements AiClientPort as a pure adapter: receives ready-to-send text
 * (system instruction + user message) and an optional JSON schema,
 * keeping all prompt construction in the application layer.
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs?hl=pt-br#javascript
 * - https://ai.google.dev/gemini-api/docs/models?hl=pt-br
 * - https://ai.google.dev/gemini-api/docs/structured-output
 * - https://ai.google.dev/gemini-api/docs/safety-settings
 */

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import type { GenerateContentResponse, SafetySetting } from '@google/genai';
import type { ConfigService } from '@nestjs/config';

import type { AiClientPort } from '../../application/ports/ai-client.port';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import type { EnvConfig } from '../../shared/config/env.validation';
import {
  AiSafetyBlockedError,
  AiTimeoutError,
  AiInvalidJsonError,
  AiMaxTokensError,
} from '../../application/ai/errors';

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
    this.model = this.config.get('GEMINI_MODEL', { infer: true });
    this.timeoutMs = this.config.get('GEMINI_TIMEOUT_MS', { infer: true });
  }

  /**
   * Send a prompt to Gemini and return the raw text response.
   *
   * When responseJsonSchema is provided, Gemini is configured for
   * structured JSON output mode.
   */
  async generate(
    systemInstruction: string,
    userMessage: string,
    responseJsonSchema?: Record<string, unknown>,
  ): Promise<string> {
    return await this.callGemini(systemInstruction, userMessage, responseJsonSchema);
  }

  private async callGemini(
    systemInstruction: string,
    userMessage: string,
    responseJsonSchema?: Record<string, unknown>,
  ): Promise<string> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, this.timeoutMs);

    try {
      const response: GenerateContentResponse = await this.client.models.generateContent({
        model: this.model,
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0,
          topP: 1,
          topK: 1,
          candidateCount: 1,
          maxOutputTokens: 1024,
          ...(responseJsonSchema
            ? {
                responseMimeType: 'application/json',
                responseJsonSchema,
              }
            : {}),
          safetySettings: this.buildSafetySettings(),
          abortSignal: abortController.signal,
        },
      });

      return this.extractText(response);
    } catch (err: unknown) {
      throw this.normalizeError(err);
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Validate the response and extract the text content. */
  private extractText(response: GenerateContentResponse): string {
    this.checkSafetyBlock(response);
    this.checkMaxTokens(response);

    const text = response.text;
    if (!text) {
      throw new AiInvalidJsonError('', 'Empty response text from Gemini');
    }

    const finishReason = response.candidates?.[0]?.finishReason ?? 'unknown';
    this.logger.log(
      `[GeminiClient] Received response (${text.length} chars, finishReason=${finishReason})`,
    );

    return text;
  }

  /** Convert SDK/runtime errors into domain-specific error types. */
  private normalizeError(err: unknown): Error {
    if (err instanceof AiSafetyBlockedError) return err;
    if (err instanceof AiMaxTokensError) return err;
    if (err instanceof AiInvalidJsonError) return err;

    if (err instanceof DOMException || (err instanceof Error && err.name === 'AbortError')) {
      return new AiTimeoutError(this.timeoutMs);
    }

    return err instanceof Error ? err : new Error(String(err));
  }

  /**
   * Build safety settings appropriate for a government-facing application.
   *
   * All thresholds are set to BLOCK_ONLY_HIGH because this is a municipal
   * triage service that processes real citizen complaints:
   *
   * - **Harassment**: reports may contain frustrated or rude language.
   * - **Dangerous Content**: reports about exposed wiring, gas leaks,
   *   collapse risks, flooding, etc. are legitimate municipal issues.
   * - **Hate Speech / Sexually Explicit**: unlikely in urban reports,
   *   but BLOCK_ONLY_HIGH still blocks the worst content while avoiding
   *   false positives on edge-case descriptions.
   *
   * Reference: https://ai.google.dev/gemini-api/docs/safety-settings
   */
  private buildSafetySettings(): SafetySetting[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];
  }

  /** Finish reasons that indicate the response was blocked by safety/policy. */
  private static readonly BLOCKED_FINISH_REASONS = new Set([
    'SAFETY',
    'RECITATION',
    'BLOCKLIST',
    'PROHIBITED_CONTENT',
  ]);

  /**
   * Check if the response was blocked or truncated by safety filters.
   *
   * Gemini can block at two levels:
   *   1. Prompt-level: promptFeedback.blockReason is set.
   *   2. Output-level: candidate finishReason is SAFETY, RECITATION,
   *      BLOCKLIST, or PROHIBITED_CONTENT.
   *
   * Both cases result in AiSafetyBlockedError so callers can handle
   * the situation deterministically (e.g. mark report as FAILED
   * instead of retrying indefinitely).
   */
  private checkSafetyBlock(response: GenerateContentResponse): void {
    this.checkPromptBlock(response);
    this.checkCandidateBlock(response);
  }

  private checkPromptBlock(response: GenerateContentResponse): void {
    const promptFeedback = response.promptFeedback;
    if (promptFeedback?.blockReason) {
      const reason = promptFeedback.blockReasonMessage ?? promptFeedback.blockReason;
      this.logger.error(`[GeminiClient] Response blocked by safety filter: ${reason}`);
      throw new AiSafetyBlockedError(reason);
    }
  }

  /**
   * Detect responses truncated by the output token limit.
   *
   * When finishReason is MAX_TOKENS, the response JSON is incomplete.
   * This is NOT a safety block — it means maxOutputTokens was insufficient.
   * Throwing a specific error allows callers to distinguish this from
   * safety blocks and potentially retry or adjust.
   */
  private checkMaxTokens(response: GenerateContentResponse): void {
    const finishReason = response.candidates?.[0]?.finishReason as string | undefined;
    if (finishReason === 'MAX_TOKENS') {
      const textLen = response.text?.length ?? 0;
      this.logger.warn(
        `[GeminiClient] Response truncated by MAX_TOKENS (${textLen} chars). Consider increasing maxOutputTokens.`,
      );
      throw new AiMaxTokensError(textLen);
    }
  }

  private checkCandidateBlock(response: GenerateContentResponse): void {
    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason as string | undefined;

    if (finishReason && GeminiClient.BLOCKED_FINISH_REASONS.has(finishReason)) {
      const ratings = candidate?.safetyRatings
        ?.filter((r) => r.blocked)
        .map((r) => `${r.category}:${r.probability}`)
        .join(', ');

      const reason = ratings ?? `${finishReason} (no details)`;
      this.logger.error(`[GeminiClient] Candidate blocked by safety filter: ${reason}`);
      throw new AiSafetyBlockedError(reason);
    }
  }
}
