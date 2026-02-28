/**
 * Classify Report Use Case – orchestrates AI classification with caching, validation, and retry.
 *
 * This is the primary entry point for classifying urban issue reports
 * using AI with structured outputs.
 *
 * Usage:
 *   const result = await classifyReportUseCase.execute({
 *     title: 'Broken streetlight',
 *     description: 'The light on Rua das Flores has been out for 3 days.',
 *     location: '01310-100',
 *   });
 */

import type { AiClientPort } from '../../ports/ai-client.port';
import type { AiCache } from '../../ports/ai-cache.port';
import type { AppLoggerPort } from '../../ports/logger.port';
import type { ClassifyReportPort } from '../../ports/classify-report.port';
import { AiClassificationSchemaRefined } from '../validators';
import { buildCacheKey } from '../normalization';
import {
  AiInvalidJsonError,
  AiValidationError,
  AiTimeoutError,
  AiSafetyBlockedError,
} from '../errors';
import { PROMPT_VERSION } from '../types';
import type { AiClassificationResult, AiEnrichmentInput } from '../types';

export class ClassifyReportUseCase implements ClassifyReportPort {
  constructor(
    private readonly aiClient: AiClientPort,
    private readonly cache: AiCache<AiClassificationResult>,
    private readonly logger: AppLoggerPort,
  ) {}

  /**
   * Classify an urban issue report using AI.
   *
   * Flow:
   * 1. Check exact cache.
   * 2. Call AI client for structured classification.
   * 3. Parse JSON strictly.
   * 4. Validate with Zod (refined schema).
   * 5. On parse/validation failure, attempt one repair retry.
   * 6. Cache and return result.
   */
  async execute(input: AiEnrichmentInput): Promise<AiClassificationResult> {
    const cacheKey = buildCacheKey(PROMPT_VERSION, input.title, input.description, input.location);

    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`[ClassifyReportUseCase] Cache hit for key: ${cacheKey.substring(0, 12)}…`);
      return cached;
    }

    // 2. Call AI client
    const rawResponse = await this.callAiClient(async () => await this.aiClient.classify(input));

    // 3 & 4. Parse + validate
    const firstAttempt = this.parseAndValidate(rawResponse);
    if (firstAttempt.success) {
      this.cache.set(cacheKey, firstAttempt.data);
      this.logger.log(
        `[ClassifyReportUseCase] Classification successful: category=${firstAttempt.data.category}, priority=${firstAttempt.data.priority}`,
      );
      return firstAttempt.data;
    }

    // 5. Repair retry
    this.logger.warn(
      `[ClassifyReportUseCase] First attempt failed: ${firstAttempt.error}. Attempting repair.`,
    );

    const repairRaw = await this.callAiClient(
      async () => await this.aiClient.repair(input, rawResponse, firstAttempt.error),
    );

    const repairAttempt = this.parseAndValidate(repairRaw);
    if (repairAttempt.success) {
      this.cache.set(cacheKey, repairAttempt.data);
      this.logger.log(
        `[ClassifyReportUseCase] Repair successful: category=${repairAttempt.data.category}, priority=${repairAttempt.data.priority}`,
      );
      return repairAttempt.data;
    }

    // Both attempts failed
    this.logger.error(
      `[ClassifyReportUseCase] Both attempts failed. Last error: ${repairAttempt.error}`,
    );
    throw this.buildFinalError(repairRaw, repairAttempt.error);
  }

  /**
   * Execute an AI client call with consistent error logging.
   * Eliminates duplicated try/catch blocks (DRY).
   */
  private async callAiClient(fn: () => Promise<string>): Promise<string> {
    try {
      return await fn();
    } catch (err: unknown) {
      if (err instanceof AiTimeoutError) {
        this.logger.error(`[ClassifyReportUseCase] AI timeout: ${err.message}`);
      } else if (err instanceof AiSafetyBlockedError) {
        this.logger.error(`[ClassifyReportUseCase] Safety block: ${err.message}`);
      }
      throw err;
    }
  }

  private parseAndValidate(
    raw: string,
  ): { success: true; data: AiClassificationResult } | { success: false; error: string } {
    // Strict JSON parse
    // eslint-disable-next-line no-useless-assignment -- needed for scope: assigned inside try, used after catch
    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(raw);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `JSON parse error: ${message}` };
    }

    // Zod validation (with refinement)
    const result = AiClassificationSchemaRefined.safeParse(parsed);
    if (!result.success) {
      const zodErrors = new Map<string, string[]>();
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        const existing = zodErrors.get(path) ?? [];
        existing.push(issue.message);
        zodErrors.set(path, existing);
      }
      return {
        success: false,
        error: `Zod validation error: ${JSON.stringify(Object.fromEntries(zodErrors))}`,
      };
    }

    return { success: true, data: result.data };
  }

  private buildFinalError(raw: string, errorMsg: string): Error {
    if (errorMsg.startsWith('JSON parse error')) {
      return new AiInvalidJsonError(raw, errorMsg);
    }
    if (errorMsg.startsWith('Zod validation error')) {
      // eslint-disable-next-line no-useless-assignment -- reassigned in both try/catch branches
      let zodErrors: Record<string, string[]> = {};
      try {
        const inner = errorMsg.replace('Zod validation error: ', '');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns any
        zodErrors = JSON.parse(inner) as Record<string, string[]>;
      } catch {
        zodErrors = { _: [errorMsg] };
      }
      return new AiValidationError(zodErrors, raw);
    }
    return new Error(errorMsg);
  }
}
