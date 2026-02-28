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
  category: 'Iluminação Pública',
  subcategory: 'Poste apagado',
  new_category_suggestion: null,
  priority: 'Média',
  technical_summary: 'Poste sem funcionamento reportado na Rua das Flores.',
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
    generate: vi.fn<AiClientPort['generate']>().mockResolvedValue(VALID_JSON),
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
    expect(aiClient.generate).toHaveBeenCalledOnce();
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
    expect(aiClient.generate).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('retries with repair when first attempt returns invalid JSON', async () => {
    // Arrange — first call (classify) returns invalid, second call (repair) returns valid
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce('not-json')
        .mockResolvedValueOnce(VALID_JSON),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.generate).toHaveBeenCalledTimes(2);
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('retries with repair when first attempt fails Zod validation', async () => {
    // Arrange — valid JSON but invalid schema (missing required field)
    const invalidPayload = JSON.stringify({
      category: 'Iluminação Pública',
      subcategory: 'Poste apagado',
      new_category_suggestion: null,
      priority: 'Média',
      // technical_summary missing
    });
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce(invalidPayload)
        .mockResolvedValueOnce(VALID_JSON),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act
    const result = await useCase.execute(VALID_INPUT);

    // Assert
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.generate).toHaveBeenCalledTimes(2);
  });

  it('throws AiInvalidJsonError when both attempts return invalid JSON', async () => {
    // Arrange — both calls return unparseable JSON
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce('bad{json')
        .mockResolvedValueOnce('still{bad'),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiInvalidJsonError);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('throws AiValidationError when both attempts fail Zod validation', async () => {
    // Arrange — valid JSON but wrong enum value on both calls
    const invalidPayload = JSON.stringify({
      category: 'InvalidCategory',
      new_category_suggestion: null,
      priority: 'Média',
      technical_summary: 'Summary.',
    });
    const aiClient = createMockAiClient({
      generate: vi.fn<AiClientPort['generate']>().mockResolvedValue(invalidPayload),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiValidationError);
  });

  it('propagates AiTimeoutError from first generate call', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      generate: vi.fn<AiClientPort['generate']>().mockRejectedValue(new AiTimeoutError(30_000)),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiTimeoutError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('propagates AiSafetyBlockedError from first generate call', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockRejectedValue(new AiSafetyBlockedError('HARM_CATEGORY_HARASSMENT')),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiSafetyBlockedError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('propagates AiTimeoutError from repair generate call', async () => {
    // Arrange — first call returns invalid JSON, second call (repair) times out
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce('not-json')
        .mockRejectedValueOnce(new AiTimeoutError(30_000)),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiTimeoutError);
  });
});
