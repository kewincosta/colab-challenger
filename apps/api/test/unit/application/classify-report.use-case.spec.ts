import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassifyReportUseCase } from '../../../src/application/ai/use-cases/classify-report.use-case';
import type { AiClientPort } from '../../../src/application/ports/ai-client.port';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import {
  AiTimeoutError,
  AiSafetyBlockedError,
  AiInvalidJsonError,
  AiValidationError,
  AiMaxTokensError,
} from '../../../src/application/ai/errors';
import {
  createMockLogger,
  createMockAiClient,
  createMockCache,
  VALID_CLASSIFICATION_INPUT,
  VALID_CLASSIFICATION_RESULT,
} from '../../helpers';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_INPUT = VALID_CLASSIFICATION_INPUT;
const VALID_RESULT = VALID_CLASSIFICATION_RESULT;
const VALID_JSON = JSON.stringify(VALID_RESULT);

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
    const aiClient = createMockAiClient({}, VALID_JSON);
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
    const aiClient = createMockAiClient({}, VALID_JSON);
    const cache = createMockCache({
      get: vi.fn().mockResolvedValue(VALID_RESULT),
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

  it('retries with repair when response is truncated JSON (not treated as safety block)', async () => {
    // Arrange — simulate Gemini returning truncated JSON (e.g. mid-generation cut)
    const truncatedJson =
      '{"category":"Iluminação Pública","priority":"Alta","technical_summary":"Poste com';
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce(truncatedJson)
        .mockResolvedValueOnce(VALID_JSON),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act — truncated JSON should trigger repair retry, NOT safety block
    const result = await useCase.execute(VALID_INPUT);

    // Assert — repair succeeds
    expect(result).toEqual(VALID_RESULT);
    expect(aiClient.generate).toHaveBeenCalledTimes(2);
    expect(cache.set).toHaveBeenCalledOnce();
  });

  it('throws AiInvalidJsonError when both attempts return truncated JSON', async () => {
    // Arrange — both calls return unparseable truncated JSON
    const truncated1 =
      '{"category":"Iluminação Pública","priority":"Alta","technical_summary":"Poste com';
    const truncated2 =
      '{"category":"Infraestrutura Urbana","priority":"Média","technical_summary":"Bura';
    const aiClient = createMockAiClient({
      generate: vi
        .fn<AiClientPort['generate']>()
        .mockResolvedValueOnce(truncated1)
        .mockResolvedValueOnce(truncated2),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert — should throw parse error, NOT safety block
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiInvalidJsonError);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('propagates AiMaxTokensError from generate call', async () => {
    // Arrange
    const aiClient = createMockAiClient({
      generate: vi.fn<AiClientPort['generate']>().mockRejectedValue(new AiMaxTokensError(80)),
    });
    const cache = createMockCache();
    const useCase = new ClassifyReportUseCase(aiClient, cache, logger);

    // Act & Assert
    await expect(useCase.execute(VALID_INPUT)).rejects.toBeInstanceOf(AiMaxTokensError);
    expect(logger.warn).toHaveBeenCalled();
  });
});
