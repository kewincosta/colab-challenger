/**
 * Integration test — Process Classification flow.
 *
 * Exercises ProcessClassificationUseCase wired through a self-contained
 * NestJS module. All external dependencies (DB, AI, queue) are replaced
 * with in-memory / mock implementations from shared test helpers.
 *
 * Scenarios:
 *   1. PENDING report → PROCESSING → AI success → DONE
 *   2. Report not found → skip (no save, no AI call)
 *   3. Already DONE report → idempotency (skip)
 *   4. AI failure → FAILED, error re-thrown for BullMQ retry
 *   5. FAILED report → retry → DONE
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { type INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ProcessClassificationUseCase } from '../../src/application/reports/use-cases/process-classification.use-case';
import { Report } from '../../src/domain/reports/entities/report.entity';
import { Location } from '../../src/domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../src/domain/reports/value-objects/classification-status.value-object';

import {
  REPORT_REPOSITORY_TOKEN,
  APP_LOGGER_TOKEN,
  AI_CLASSIFICATION_SERVICE_TOKEN,
  CLASSIFICATION_RESULT_REPOSITORY_TOKEN,
} from '../../src/shared/constants/tokens';

import {
  InMemoryReportRepository,
  InMemoryClassificationResultRepository,
  createMockLogger,
  createMockClassifyReport,
} from '../helpers';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockLogger = createMockLogger();
const inMemoryRepo = new InMemoryReportRepository();
const inMemoryClassificationResultRepo = new InMemoryClassificationResultRepository();
const mockClassifyReport = createMockClassifyReport();

// ── Self-contained test module ────────────────────────────────────────

@Module({
  providers: [
    { provide: APP_LOGGER_TOKEN, useValue: mockLogger },
    { provide: REPORT_REPOSITORY_TOKEN, useValue: inMemoryRepo },
    {
      provide: CLASSIFICATION_RESULT_REPOSITORY_TOKEN,
      useValue: inMemoryClassificationResultRepo,
    },
    { provide: AI_CLASSIFICATION_SERVICE_TOKEN, useValue: mockClassifyReport },
    {
      provide: ProcessClassificationUseCase,
      useFactory: () =>
        new ProcessClassificationUseCase(
          inMemoryRepo,
          inMemoryClassificationResultRepo,
          mockClassifyReport,
          mockLogger,
        ),
    },
  ],
})
class TestProcessClassificationModule {}

// ── Helpers ───────────────────────────────────────────────────────────

function seedPendingReport(id = 'report-1'): Report {
  const report = Report.restore(
    {
      title: 'Broken streetlight',
      description: 'Streetlight not working for 3 days',
      location: Location.create({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01001-000',
      }),
      classificationStatus: ClassificationStatus.PENDING,
    },
    id,
  );
  inMemoryRepo.items.push(report);
  return report;
}

function seedDoneReport(id = 'done-1'): Report {
  const report = Report.restore(
    {
      title: 'Already classified',
      description: 'This report was already classified',
      location: Location.create({
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01310-100',
      }),
      classificationStatus: ClassificationStatus.DONE,
    },
    id,
  );
  inMemoryRepo.items.push(report);
  return report;
}

function seedFailedReport(id = 'failed-1'): Report {
  const report = Report.restore(
    {
      title: 'Failed classification',
      description: 'This report had a previous failure',
      location: Location.create({
        street: 'Rua Augusta',
        number: '500',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01304-000',
      }),
      classificationStatus: ClassificationStatus.FAILED,
      lastClassificationError: 'AI service unavailable',
      classificationAttempts: 1,
    },
    id,
  );
  inMemoryRepo.items.push(report);
  return report;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Process Classification (integration)', () => {
  let app: INestApplication;
  let useCase: ProcessClassificationUseCase;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestProcessClassificationModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    useCase = moduleRef.get(ProcessClassificationUseCase);
  });

  beforeEach(() => {
    inMemoryRepo.clear();
    inMemoryClassificationResultRepo.clear();
    vi.clearAllMocks();
    // Reset the default successful response
    (mockClassifyReport.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      category: 'Iluminação Pública',
      priority: 'Alta',
      technical_summary: 'Poste com defeito necessitando reparo imediato.',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Scenario 1: Happy path ───────────────────────────────────────

  it('classifies a PENDING report and transitions it to DONE', async () => {
    // Arrange
    seedPendingReport('report-1');

    // Act
    await useCase.execute({ reportId: 'report-1', attemptsMade: 1 });

    // Assert
    const report = await inMemoryRepo.findById('report-1');
    expect(report).not.toBeNull();
    expect(report!.getClassificationStatus()).toBe(ClassificationStatus.DONE);

    // Classification result saved to separate entity
    const classificationResult = await inMemoryClassificationResultRepo.findByReportId('report-1');
    expect(classificationResult).not.toBeNull();
    expect(classificationResult!.getCategory()).toBe('Iluminação Pública');
    expect(classificationResult!.getPriority()).toBe('Alta');
    expect(classificationResult!.getTechnicalSummary()).toBe(
      'Poste com defeito necessitando reparo imediato.',
    );

    expect(mockClassifyReport.execute).toHaveBeenCalledOnce();
    expect(mockLogger.log).toHaveBeenCalled();
  });

  // ── Scenario 2: Report not found ─────────────────────────────────

  it('silently skips when the report does not exist', async () => {
    // Act
    await useCase.execute({ reportId: 'non-existent', attemptsMade: 1 });

    // Assert
    expect(mockClassifyReport.execute).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('non-existent'));
  });

  // ── Scenario 3: Idempotency — already DONE ───────────────────────

  it('skips classification when the report is already DONE', async () => {
    // Arrange
    seedDoneReport('done-1');

    // Act
    await useCase.execute({ reportId: 'done-1', attemptsMade: 1 });

    // Assert
    const report = await inMemoryRepo.findById('done-1');
    expect(report!.getClassificationStatus()).toBe(ClassificationStatus.DONE);
    expect(mockClassifyReport.execute).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('already classified'));
  });

  // ── Scenario 4: AI failure → FAILED ──────────────────────────────

  it('marks the report FAILED and re-throws when AI classification fails', async () => {
    // Arrange
    seedPendingReport('report-fail');
    (mockClassifyReport.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('AI service unavailable'),
    );

    // Act & Assert
    await expect(useCase.execute({ reportId: 'report-fail', attemptsMade: 2 })).rejects.toThrow(
      'AI service unavailable',
    );

    const report = await inMemoryRepo.findById('report-fail');
    expect(report!.getClassificationStatus()).toBe(ClassificationStatus.FAILED);
    expect(report!.getLastClassificationError()).toBe('AI service unavailable');
    expect(report!.getClassificationAttempts()).toBe(2);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // ── Scenario 5: Retry on FAILED ──────────────────────────────────

  it('retries a FAILED report and transitions it to DONE', async () => {
    // Arrange
    seedFailedReport('failed-1');

    // Act
    await useCase.execute({ reportId: 'failed-1', attemptsMade: 2 });

    // Assert
    const report = await inMemoryRepo.findById('failed-1');
    expect(report!.getClassificationStatus()).toBe(ClassificationStatus.DONE);

    const classificationResult = await inMemoryClassificationResultRepo.findByReportId('failed-1');
    expect(classificationResult).not.toBeNull();
    expect(classificationResult!.getCategory()).toBe('Iluminação Pública');
    expect(classificationResult!.getPriority()).toBe('Alta');
    expect(classificationResult!.getTechnicalSummary()).toBe(
      'Poste com defeito necessitando reparo imediato.',
    );

    expect(mockClassifyReport.execute).toHaveBeenCalledOnce();
  });
});
