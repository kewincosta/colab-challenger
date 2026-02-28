/**
 * Shared mock factories for tests.
 *
 * Centralises creation of commonly used test doubles so individual
 * spec files stay focused on behaviour, not boilerplate.
 */

import { vi } from 'vitest';
import type { AppLoggerPort } from '../../src/application/ports/logger.port';
import type { ClockPort } from '../../src/application/ports/clock.port';
import type { QueueProducerPort } from '../../src/application/ports/queue-producer.port';
import type { AiClientPort } from '../../src/application/ports/ai-client.port';
import type { AiCache } from '../../src/application/ports/ai-cache.port';
import type { ClassifyReportPort } from '../../src/application/ports/classify-report.port';
import type { AiClassificationResult } from '../../src/application/ai/types';

// ── Logger ────────────────────────────────────────────────────────────

export function createMockLogger(): AppLoggerPort {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}

// ── Clock ─────────────────────────────────────────────────────────────

const DEFAULT_FIXED_DATE = new Date('2026-01-15T10:00:00Z');

export function createFakeClock(fixed?: Date): ClockPort {
  return { now: () => fixed ?? DEFAULT_FIXED_DATE };
}

// ── Queue Producer ────────────────────────────────────────────────────

export function createMockQueueProducer(): QueueProducerPort {
  return {
    publishClassificationJob: vi.fn().mockResolvedValue(undefined),
  };
}

// ── AI Client ─────────────────────────────────────────────────────────

export function createMockAiClient(
  overrides: Partial<AiClientPort> = {},
  defaultResponse = '{}',
): AiClientPort {
  return {
    generate: vi.fn<AiClientPort['generate']>().mockResolvedValue(defaultResponse),
    ...overrides,
  };
}

// ── AI Cache ──────────────────────────────────────────────────────────

export function createMockCache<T = AiClassificationResult>(
  overrides: Partial<AiCache<T>> = {},
): AiCache<T> {
  return {
    get: vi.fn<AiCache<T>['get']>().mockReturnValue(undefined),
    set: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    clear: vi.fn(),
    size: 0,
    ...overrides,
  };
}

// ── Classify Report Port ──────────────────────────────────────────────

export function createMockClassifyReport(
  overrides: Partial<ClassifyReportPort> = {},
): ClassifyReportPort {
  return {
    execute: vi.fn().mockResolvedValue({
      category: 'Iluminação Pública',
      priority: 'Alta',
      technical_summary: 'Poste com defeito necessitando reparo imediato.',
    }),
    ...overrides,
  };
}
