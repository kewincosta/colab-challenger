import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessClassificationUseCase } from '../../../src/application/reports/use-cases/process-classification.use-case';
import type { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import type { ClassificationResultRepository } from '../../../src/domain/reports/repositories/classification-result.repository';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import type { ClassificationResult } from '../../../src/domain/reports/entities/classification-result.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';
import type { ClassifyReportPort } from '../../../src/application/ports/classify-report.port';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import { createMockLogger, createMockClassificationResultRepository } from '../../helpers';

function createPendingReport(id = 'report-1'): Report {
  return Report.restore(
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
}

describe('ProcessClassificationUseCase', () => {
  let savedReports: Report[];
  let repo: ReportRepository;
  let classificationResultRepo: ClassificationResultRepository;
  let classifyReport: ClassifyReportPort;
  let logger: AppLoggerPort;
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
    classificationResultRepo = createMockClassificationResultRepository();
    classifyReport = {
      execute: vi.fn().mockResolvedValue({
        category: 'Iluminação Pública',
        priority: 'Alta',
        technical_summary: 'Poste com defeito necessitando reparo imediato.',
      }),
    };
    logger = createMockLogger();
    useCase = new ProcessClassificationUseCase(
      repo,
      classificationResultRepo,
      classifyReport,
      logger,
    );
  });

  it('classifies a PENDING report, saves result separately, and marks DONE', async () => {
    await useCase.execute({ reportId: 'report-1', attemptsMade: 1 });

    expect(classifyReport.execute).toHaveBeenCalledOnce();
    // save is called twice: once for PROCESSING, once for DONE
    expect(repo.save).toHaveBeenCalledTimes(2);

    const lastSaved = savedReports[savedReports.length - 1];
    expect(lastSaved.getClassificationStatus()).toBe(ClassificationStatus.DONE);

    // ClassificationResult saved to separate repository
    expect(classificationResultRepo.save).toHaveBeenCalledOnce();
    const savedResult = (classificationResultRepo.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as ClassificationResult;
    expect(savedResult.getReportId()).toBe('report-1');
    expect(savedResult.getCategory()).toBe('Iluminação Pública');
    expect(savedResult.getPriority()).toBe('Alta');
    expect(savedResult.getTechnicalSummary()).toBe(
      'Poste com defeito necessitando reparo imediato.',
    );
  });

  it('skips classification when report is not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await useCase.execute({ reportId: 'missing-id', attemptsMade: 1 });

    expect(classifyReport.execute).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(classificationResultRepo.save).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('skips classification when report is already DONE (idempotency)', async () => {
    const doneReport = Report.restore(
      {
        title: 'Already done',
        description: 'This report was already classified',
        location: Location.create({
          street: 'Rua A',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          postcode: '01001-000',
        }),
        classificationStatus: ClassificationStatus.DONE,
      },
      'done-report',
    );
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(doneReport);

    await useCase.execute({ reportId: 'done-report', attemptsMade: 1 });

    expect(classifyReport.execute).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(classificationResultRepo.save).not.toHaveBeenCalled();
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
    expect(classificationResultRepo.save).not.toHaveBeenCalled();

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
        location: Location.create({
          street: 'Rua B',
          number: '2',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          postcode: '01001-000',
        }),
        classificationStatus: ClassificationStatus.FAILED,
        lastClassificationError: 'Previous error',
        classificationAttempts: 1,
      },
      'failed-report',
    );
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(failedReport);

    await useCase.execute({ reportId: 'failed-report', attemptsMade: 2 });

    expect(classifyReport.execute).toHaveBeenCalledOnce();
    expect(classificationResultRepo.save).toHaveBeenCalledOnce();
    const lastSaved = savedReports[savedReports.length - 1];
    expect(lastSaved.getClassificationStatus()).toBe(ClassificationStatus.DONE);
  });
});
