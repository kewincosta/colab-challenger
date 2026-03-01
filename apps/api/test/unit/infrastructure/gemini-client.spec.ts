import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../../../src/infrastructure/ai/gemini.client';
import {
  AiTimeoutError,
  AiSafetyBlockedError,
  AiInvalidJsonError,
  AiMaxTokensError,
} from '../../../src/application/ai/errors';
import { createMockLogger } from '../../helpers';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';

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
    HarmBlockThreshold: { BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH' },
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

const SYSTEM_INSTRUCTION = 'You are a classifier.';
const USER_MESSAGE = 'Classify this report.';
const JSON_SCHEMA = { type: 'object', properties: { category: { type: 'string' } } };

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

  it('returns raw text on successful generate call', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: '{"category":"Lighting"}',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act
    const result = await client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE, JSON_SCHEMA);

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
    await expect(client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE)).rejects.toBeInstanceOf(
      AiInvalidJsonError,
    );
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
    await expect(client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE)).rejects.toBeInstanceOf(
      AiSafetyBlockedError,
    );
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
    await expect(client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE)).rejects.toBeInstanceOf(
      AiSafetyBlockedError,
    );
  });

  it('throws AiTimeoutError when request is aborted', async () => {
    // Arrange — simulate AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockGenerateContent.mockRejectedValue(abortError);
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE)).rejects.toBeInstanceOf(
      AiTimeoutError,
    );
  });

  it('throws AiMaxTokensError when finishReason is MAX_TOKENS', async () => {
    // Arrange — simulate truncated response due to token limit
    mockGenerateContent.mockResolvedValue({
      text: '{"category":"Iluminação Pública","priority":"Alta","technical_summary":"Poste com',
      promptFeedback: {},
      candidates: [{ finishReason: 'MAX_TOKENS' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act & Assert
    await expect(client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE)).rejects.toBeInstanceOf(
      AiMaxTokensError,
    );
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('MAX_TOKENS'));
  });

  it('passes JSON schema to Gemini config when provided', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: '{"category":"Lighting"}',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act
    const result = await client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE, JSON_SCHEMA);

    // Assert
    expect(result).toBe('{"category":"Lighting"}');
    expect(mockGenerateContent).toHaveBeenCalledOnce();
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config.responseMimeType).toBe('application/json');
    expect(callArgs.config.responseJsonSchema).toEqual(JSON_SCHEMA);
  });

  it('omits JSON schema config when not provided', async () => {
    // Arrange
    mockGenerateContent.mockResolvedValue({
      text: 'plain text response',
      promptFeedback: {},
      candidates: [{ finishReason: 'STOP' }],
    });
    const client = new GeminiClient(createMockConfig(), logger);

    // Act
    const result = await client.generate(SYSTEM_INSTRUCTION, USER_MESSAGE);

    // Assert
    expect(result).toBe('plain text response');
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config.responseMimeType).toBeUndefined();
    expect(callArgs.config.responseJsonSchema).toBeUndefined();
  });
});
