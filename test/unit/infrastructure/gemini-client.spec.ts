import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../../../src/infrastructure/ai/gemini.client';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import {
  AiTimeoutError,
  AiSafetyBlockedError,
  AiInvalidJsonError,
} from '../../../src/application/ai/errors';

// ---------------------------------------------------------------------------
// Mock @google/genai — must be before import of GeminiClient in test scope
// ---------------------------------------------------------------------------

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  function GoogleGenAI() {
    return { models: { generateContent: mockGenerateContent } };
  }
  return {
    GoogleGenAI,
    HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
  };
});

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function createMockConfig(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    GEMINI_API_KEY: 'test-api-key',
    GEMINI_MODEL: 'gemini-test',
    GEMINI_TIMEOUT_MS: 5_000,
    ...overrides,
  };

  return {
    get: vi.fn((key: string) => values[key]),
  } as any;
}

function createMockLogger(): AppLoggerPort {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}

const VALID_INPUT = {
  title: 'Broken streetlight',
  description: 'Light out for 3 days.',
  location: '01310-100',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeminiClient', () => {
  let logger: AppLoggerPort;

  beforeEach(() => {
    logger = createMockLogger();
    mockGenerateContent.mockReset();
  });

  it('accepts config with valid GEMINI_API_KEY and creates client', () => {
    // GEMINI_API_KEY is now validated at startup by Zod — the constructor
    // trusts ConfigService to provide it. This test ensures construction succeeds.
    const config = createMockConfig();
    const client = new GeminiClient(config, logger);
    expect(client).toBeDefined();
  });

  it('returns raw text on successful classify call', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: '{"category":"Lighting"}',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act
    const result = await client.classify(VALID_INPUT);

    // Assert
    expect(result).toBe('{"category":"Lighting"}');
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it('throws AiInvalidJsonError when response text is empty', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: '',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.classify(VALID_INPUT)).rejects.toBeInstanceOf(AiInvalidJsonError);
  });

  it('throws AiSafetyBlockedError on promptFeedback blockReason', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: null,
      promptFeedback: { blockReason: 'SAFETY', blockReasonMessage: 'Content blocked' },
      candidates: [],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.classify(VALID_INPUT)).rejects.toBeInstanceOf(AiSafetyBlockedError);
  });

  it('throws AiSafetyBlockedError on candidate finishReason=SAFETY', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: null,
      promptFeedback: {},
      candidates: [
        {
          finishReason: 'SAFETY',
          safetyRatings: [
            { category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH', blocked: true },
          ],
        },
      ],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.classify(VALID_INPUT)).rejects.toBeInstanceOf(AiSafetyBlockedError);
  });

  it('throws AiTimeoutError when request is aborted', async () => {
    // Arrange — simulate AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockGenerateContent.mockRejectedValue(abortError);
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.classify(VALID_INPUT)).rejects.toBeInstanceOf(AiTimeoutError);
  });

  it('repair calls generateContent with repair prompt', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: '{"category":"Lighting"}',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act
    const result = await client.repair(VALID_INPUT, 'bad-json', 'parse error');

    // Assert
    expect(result).toBe('{"category":"Lighting"}');
    expect(mockGenerateContent).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalled();
  });
});
