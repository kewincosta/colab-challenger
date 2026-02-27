import { describe, it, expect, vi, afterEach } from 'vitest';
import { envSchema, validateEnv } from '../../../src/shared/config/env.validation';

/**
 * Minimal valid env — only required vars; optional ones use Zod defaults.
 */
function validEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    GEMINI_API_KEY: 'test-key-abc123',
    ...overrides,
  };
}

describe('envSchema', () => {
  it('accepts minimal valid env and fills defaults', () => {
    const result = envSchema.safeParse(validEnv());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.PORT).toBe(3000);
    expect(result.data.DB_HOST).toBe('localhost');
    expect(result.data.DB_PORT).toBe(5432);
    expect(result.data.DB_USER).toBe('postgres');
    expect(result.data.DB_PASSWORD).toBe('postgres');
    expect(result.data.DB_NAME).toBe('urban_triage');
    expect(result.data.GEMINI_API_KEY).toBe('test-key-abc123');
    expect(result.data.GEMINI_MODEL).toBe('gemini-3-flash-preview');
    expect(result.data.GEMINI_TIMEOUT_MS).toBe(30_000);
  });

  it('accepts all custom values', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      DB_HOST: 'db.prod',
      DB_PORT: '5433',
      DB_USER: 'admin',
      DB_PASSWORD: 'secret',
      DB_NAME: 'my_db',
      GEMINI_API_KEY: 'key-xyz',
      GEMINI_MODEL: 'gemini-pro',
      GEMINI_TIMEOUT_MS: '15000',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.PORT).toBe(8080);
    expect(result.data.DB_PORT).toBe(5433);
    expect(result.data.DB_USER).toBe('admin');
    expect(result.data.GEMINI_MODEL).toBe('gemini-pro');
    expect(result.data.GEMINI_TIMEOUT_MS).toBe(15_000);
  });

  it('coerces string numbers for PORT, DB_PORT, GEMINI_TIMEOUT_MS', () => {
    const result = envSchema.safeParse(validEnv({
      PORT: '4000',
      DB_PORT: '5433',
      GEMINI_TIMEOUT_MS: '60000',
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.PORT).toBe(4000);
    expect(result.data.DB_PORT).toBe(5433);
    expect(result.data.GEMINI_TIMEOUT_MS).toBe(60_000);
  });

  it('rejects missing GEMINI_API_KEY', () => {
    const result = envSchema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('GEMINI_API_KEY');
  });

  it('rejects empty GEMINI_API_KEY', () => {
    const result = envSchema.safeParse({ GEMINI_API_KEY: '' });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((i) => i.message);
    expect(messages.some((m) => m.includes('must not be empty'))).toBe(true);
  });

  it('rejects non-positive PORT', () => {
    const result = envSchema.safeParse(validEnv({ PORT: '-1' }));

    expect(result.success).toBe(false);
  });

  it('rejects non-integer DB_PORT', () => {
    const result = envSchema.safeParse(validEnv({ DB_PORT: '5.5' }));

    expect(result.success).toBe(false);
  });
});

describe('validateEnv', () => {
  const originalExit = process.exit;
  const originalError = console.error;

  afterEach(() => {
    process.exit = originalExit;
    console.error = originalError;
  });

  it('returns validated config for valid env', () => {
    const config = validateEnv(validEnv());

    expect(config.GEMINI_API_KEY).toBe('test-key-abc123');
    expect(config.PORT).toBe(3000);
  });

  it('calls process.exit(1) and logs errors for invalid env', () => {
    const logs: string[] = [];
    console.error = vi.fn((...args: unknown[]) => logs.push(args.join(' ')));
    process.exit = vi.fn() as unknown as typeof process.exit;

    validateEnv({});

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(logs.some((l) => l.includes('ENV VALIDATION FAILED'))).toBe(true);
    expect(logs.some((l) => l.includes('GEMINI_API_KEY'))).toBe(true);
  });
});
