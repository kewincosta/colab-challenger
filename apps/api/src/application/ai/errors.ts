/**
 * Custom error classes for AI integration.
 *
 * Each error type maps to a specific failure mode in the AI pipeline.
 */

export class AiTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`);
    this.name = 'AiTimeoutError';
  }
}

export class AiInvalidJsonError extends Error {
  constructor(
    readonly rawResponse: string,
    readonly parseError: string,
  ) {
    super(`AI returned invalid JSON: ${parseError}`);
    this.name = 'AiInvalidJsonError';
  }
}

export class AiValidationError extends Error {
  constructor(
    readonly zodErrors: Record<string, string[]>,
    readonly rawData: unknown,
  ) {
    super(`AI output failed Zod validation: ${JSON.stringify(zodErrors)}`);
    this.name = 'AiValidationError';
  }
}

export class AiSafetyBlockedError extends Error {
  constructor(readonly blockReason: string) {
    super(`AI response blocked by safety settings: ${blockReason}`);
    this.name = 'AiSafetyBlockedError';
  }
}

export class AiMaxTokensError extends Error {
  constructor(readonly truncatedLength: number) {
    super(
      `AI response truncated by MAX_TOKENS limit (${truncatedLength} chars). ` +
        'Consider increasing maxOutputTokens.',
    );
    this.name = 'AiMaxTokensError';
  }
}
