/**
 * Centralized environment variable validation using Zod.
 *
 * This module defines the schema for ALL env vars the application needs,
 * with defaults for optional ones and hard failures for required ones.
 *
 * Plugs into NestJS ConfigModule via the `validate` option so validation
 * runs **before** any module is instantiated — fail-fast on misconfiguration.
 */

import { z } from 'zod';

export const envSchema = z.object({
  // ── Server ──────────────────────────────────────────────────────────
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // ── Database (PostgreSQL) ───────────────────────────────────────────
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('urban_triage'),

  // ── AI / Gemini ─────────────────────────────────────────────────────
  GEMINI_API_KEY: z
    .string({ error: 'GEMINI_API_KEY is required — set it in your .env file' })
    .min(1, 'GEMINI_API_KEY must not be empty'),
  GEMINI_MODEL: z.string().default('gemini-3-flash-preview'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and return a typed config object from raw `process.env`.
 *
 * Compatible with `ConfigModule.forRoot({ validate })`.
 * On failure, logs a human-readable error table and terminates the process.
 */
export function validateEnv(raw: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(raw);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

  console.error('\n========================================');
  console.error('  ENV VALIDATION FAILED — cannot start');
  console.error('========================================\n');

  for (const { path, message } of issues) {
    console.error(`  • ${path}: ${message}`);
  }

  console.error(
    '\nCheck your .env file or docker-compose environment block.\n',
  );

  process.exit(1);
}
