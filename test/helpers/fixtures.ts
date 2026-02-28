/**
 * Shared test fixtures for AI classification data.
 *
 * Provides canonical input/output shapes used across multiple test files.
 */

import type { AiClassificationResult, AiEnrichmentInput } from '../../src/application/ai/types';
import type { AiClassification } from '../../src/domain/reports/entities/report.entity';

// ── AI Enrichment input ───────────────────────────────────────────────

export const VALID_ENRICHMENT_INPUT: AiEnrichmentInput = {
  title: 'Broken streetlight',
  description: 'The light on Rua das Flores has been out for 3 days.',
  location: '01310-100',
};

// ── AI Classification result (snake_case — AI response contract) ──────

export const VALID_CLASSIFICATION_RESULT: AiClassificationResult = {
  category: 'Iluminação Pública',
  priority: 'Média',
  technical_summary: 'Poste sem funcionamento reportado na Rua das Flores.',
};

// ── Domain AiClassification (camelCase — domain contract) ─────────────

export const VALID_AI_CLASSIFICATION: AiClassification = {
  category: 'Iluminação Pública',
  priority: 'Alta',
  technicalSummary: 'Poste com defeito necessitando reparo imediato.',
};
