import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessClassificationUseCase } from '../../../src/application/reports/use-cases/process-classification.use-case';
import type { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';
import type { ClassifyReportPort } from '../../../src/application/ports/classify-report.port';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import type { ClockPort } from '../../../src/application/ports/clock.port';

function createMockLogger(): AppLoggerPort {
  return { log: vi.fn(), error: vi.fn(), warn: vi.fn() };
}

function createFakeClock(fixed?: Date): ClockPort {
  return { now: () => fixed ?? new Date('2026-02-27T12:00:00Z') };
}

function createPendingReport(id = 'report-1'): Report {
  return Report.restore(
    {
      title: 'Broken streetlight',
      description: 'Streetlight not working for 3 days',
      location: Location.create('Rua das Flores, 123'),
      classificationStatus: ClassificationStatus.PENDING,
    },
    id,
  );
}

describe('ProcessClassificationUseCase', () => {
  let savedReports: Report[];
  let repo: ReportRepository;
  let classifyReport: ClassifyReportPort;
  let logger: AppLoggerPort;
  let clock: ClockPort;
  let useCase: ProcessClassificationUseCase;

  beforeEach(() => {
    savedReports = [];
    repo = {
      save: vi.fn(async (report: Report) => {
        savedReports.push(report);
        return report;
      }),
      findById: vi.fn(async () => createPendingReport()),
    };
    classifyReport = {
      execute: vi.fn().mockResolvedValue({
        category: 'Lighting',
        new_category_suggestion: null,
        priority: 'High',
        technical_summary: 'Streetlight malfunction requiring immediate repair.',
      }),
    };
    logger = createMockLogger();
    clock = createFakeClock();
    useCase = new ProcessClassificationUseCase(repo, classifyReport, logger, clock);
  });

  it('classifies a PENDING report and marks it DONE', async () => {
    await useCase.execute({ reportId: 'report-1', attemptsMade: 1 });

    expect(classifyReport.execute).toHaveBeenCalledOnce();
    // save is called twice: once for PROCESSING, once for DONE
    expect(repo.save).toHaveBeenCalledTimes(2);

    const lastSaved = savedReports[savedReports.length - 1];
    expect(lastSaved.getClassificationStatus()).toBe(ClassificationStatus.DONE);
    expect(lastSaved.getAiClassification()).toEqual({
      category: 'Lighting',
      newCategorySuggestion: null,
      priority: 'High',
      technicalSummary: 'Streetlight malfunction requiring immediate repair.',
    });
    expect(lastSaved.getClassifiedAt()).toEqual(new Date('2026-02-27T12:00:00Z'));
  });

  it('skips classification when report is not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await useCase.execute({ reportId: 'missing-id', attemptsMade: 1 });

    expect(classifyReport.execute).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('skips classification when report is already DONE (idempotency)', async () => {
    const doneReport = Report.restore(
      {
        title: 'Already done',
        description: 'This report was already classified',
        location: Location.create('Test'),
        classificationStatus: ClassificationStatus.DONE,
        aiClassification: {
          category: 'Lighting',
          priority: 'High',
          technicalSummary: 'Already classified.',
          newCategorySuggestion: null,
        },
      },
      'done-report',
    );
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(doneReport);

    await useCase.execute({ reportId: 'done-report', attemptsMade: 1 });

    expect(classifyReport.execute).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledOnce();
  });

  it('marks report FAILED and re-throws when AI classification fails', async () => {
    const error = new Error('AI service unavailable');
    (classifyReport.execute as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    await expect(useCase.execute({ reportId: 'report-1', attemptsMade: 2 })).rejects.toThrow(
      'AI service unavailable',
    );

    // save: PROCESSING + FAILED
    expect(repo.save).toHaveBeenCalledTimes(2);

    const lastSaved = savedReports[savedReports.length - 1];
    expect(lastSaved.getClassificationStatus()).toBe(ClassificationStatus.FAILED);
    expect(lastSaved.getLastClassificationError()).toBe('AI service unavailable');
    expect(lastSaved.getClassificationAttempts()).toBe(2);
  });

  it('allows retry on a FAILED report (FAILED → PROCESSING)', async () => {
    const failedReport = Report.restore(
      {
        title: 'Failed report',
        description: 'This report failed classification',
        location: Location.create('Test'),
        classificationStatus: ClassificationStatus.FAILED,
        lastClassificationError: 'Previous error',
        classificationAttempts: 1,
      },
      'failed-report',
    );
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(failedReport);

    await useCase.execute({ reportId: 'failed-report', attemptsMade: 2 });

    expect(classifyReport.execute).toHaveBeenCalledOnce();
    const lastSaved = savedReports[savedReports.length - 1];
    expect(lastSaved.getClassificationStatus()).toBe(ClassificationStatus.DONE);
  });
});
