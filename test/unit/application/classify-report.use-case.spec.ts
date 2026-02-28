import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassifyReportUseCase } from '../../../src/application/ai/use-cases/classify-report.use-case';
import type { AiClientPort } from '../../../src/application/ports/ai-client.port';
import type { AiCache } from '../../../src/application/ports/ai-cache.port';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import type { AiClassificationResult, AiEnrichmentInput } from '../../../src/application/ai/types';
import {
  AiTimeoutError,
  AiSafetyBlockedError,
  AiInvalidJsonError,
  AiValidationError,
} from '../../../src/application/ai/errors';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_INPUT: AiEnrichmentInput = {
  title: 'Broken streetlight',
  description: 'The light on Rua das Flores has been out for 3 days.',
  location: '01310-100',
};

const VALID_RESULT: AiClassificationResult = {
  category: 'Lighting',
  new_category_suggestion: null,
  priority: 'Medium',
  technical_summary: 'Non-functional streetlight reported on Rua das Flores.',
};

const VALID_JSON = JSON.stringify(VALID_RESULT);

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function createMockLogger(): AppLoggerPort {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}

function createMockAiClient(overrides: Partial<AiClientPort> = {}): AiClientPort {
  return {
    classify: vi.fn<AiClientPort['classify']>().mockResolvedValue(VALID_JSON),
    repair: vi.fn<AiClientPort['repair']>().mockResolvedValue(VALID_JSON),
    ...overrides,
  };
}

function createMockCache(
  overrides: Partial<AiCache<AiClassificationResult>> = {},
): AiCache<AiClassificationResult> {
  return {
    get: vi.fn<AiCache<AiClassificationResult>['get']>().mockReturnValue(undefined),
    set: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    clear: vi.fn(),
    size: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClassifyReportUseCase', () => {
  let logger: AppLoggerPort;

  beforeEach(() => {
    logger = createMockLogger();
  });

  it('returns classification on valid first attempt', async () => {
    // Arrange
    const aiClient = createMockAiClient();
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.classify).toHaveBeenCalledOnce();
    expect(aiClient.repair).not.toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('returns cached result without calling AI client', async () => {
    // Arrange
    const aiClient = createMockAiClient();
    const cache = createMockCache({
      get: vi.fn().mockReturnValue(VALID_RESULT),
    });
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.classify).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('retries with repair when first attempt returns invalid JSON', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockResolvedValue('not-json'),
      repair: vi.fn<AiClientPort['repair']>().mockResolvedValue(VALID_JSON),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.classify).toHaveBeenCalledOnce();
    expect(aiClient.repair).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('retries with repair when first attempt fails Zod validation', async () => {
    // Arrange — valid JSON but invalid schema (missing required field)
    const invalidPayload = JSON.stringify({
      category: 'Lighting',
      new_category_suggestion: null,
      priority: 'Medium',
      // technical_summary missing
    });
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockResolvedValue(invalidPayload),
      repair: vi.fn<AiClientPort['repair']>().mockResolvedValue(VALID_JSON),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.repair).toHaveBeenCalledOnce();
  });

  it('throws AiInvalidJsonError when both attempts return invalid JSON', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockResolvedValue('bad{json'),
      repair: vi.fn<AiClientPort['repair']>().mockResolvedValue('still{bad'),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiInvalidJsonError);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('throws AiValidationError when both attempts fail Zod validation', async () => {
    // Arrange — valid JSON but wrong enum value
    const invalidPayload = JSON.stringify({
      category: 'InvalidCategory',
      new_category_suggestion: null,
      priority: 'Medium',
      technical_summary: 'Summary.',
    });
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockResolvedValue(invalidPayload),
      repair: vi.fn<AiClientPort['repair']>().mockResolvedValue(invalidPayload),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiValidationError);
  });

  it('propagates AiTimeoutError from classify call', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockRejectedValue(new AiTimeoutError(30_000)),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiTimeoutError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('propagates AiSafetyBlockedError from classify call', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      classify: vi
        .fn<AiClientPort['classify']>()
        .mockRejectedValue(new AiSafetyBlockedError('HARM_CATEGORY_HARASSMENT')),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiSafetyBlockedError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('propagates AiTimeoutError from repair call', async () => {
    // Arrange — first attempt fails validation, repair times out
    const aiClient = createMockAiClient({
      classify: vi.fn<AiClientPort['classify']>().mockResolvedValue('not-json'),
      repair: vi.fn<AiClientPort['repair']>().mockRejectedValue(new AiTimeoutError(30_000)),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiTimeoutError);
  });
});
