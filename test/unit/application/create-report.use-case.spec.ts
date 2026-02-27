import { describe, it, expect, vi } from 'vitest';
import { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { AppLoggerPort } from '../../../src/application/ports/logger.port';
import { ClassifyReportPort } from '../../../src/application/ports/classify-report.port';
import { ClockPort } from '../../../src/application/ports/clock.port';

class InMemoryReportRepository implements ReportRepository {
  public items: Report[] = [];

  async save(report: Report): Promise<Report> {
    const restored = Report.restore(
      {
        title: report.getTitle(),
        description: report.getDescription(),
        location: report.getLocation(),
        createdAt: report.getCreatedAt(),
        aiClassification: report.getAiClassification(),
      },
      'test-id',
    );
    this.items.push(restored);
    return restored;
  }
}

function createMockLogger(): AppLoggerPort {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}

function createFakeClock(fixed?: Date): ClockPort {
  return { now: () => fixed ?? new Date('2026-01-15T10:00:00Z') };
}

function createMockClassifyReport(): ClassifyReportPort {
  return {
    execute: vi.fn().mockResolvedValue({
      category: 'Lighting',
      new_category_suggestion: null,
      priority: 'High',
      technical_summary: 'Streetlight malfunction requiring immediate repair.',
    }),
  };
}

describe('CreateReportUseCase', () => {
  it('creates and persists a report with AI classification', async () => {
    const repo = new InMemoryReportRepository();
    const classifyReport = createMockClassifyReport();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(repo, createMockLogger(), classifyReport, clock);

    const result = await useCase.execute({
      title: 'Broken street light',
      description: 'Street light not working on 5th Avenue',
      location: '5th Avenue & Pine St',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Broken street light');
    expect(result.description).toBe('Street light not working on 5th Avenue');
    expect(result.location).toBe('5th Avenue & Pine St');
    expect(result.category).toBe('Lighting');
    expect(result.priority).toBe('High');
    expect(result.technicalSummary).toBe('Streetlight malfunction requiring immediate repair.');
    expect(result.newCategorySuggestion).toBeNull();
    expect(result.createdAt).toEqual(new Date('2026-01-15T10:00:00Z'));
    expect(repo.items).toHaveLength(1);
    expect(classifyReport.execute).toHaveBeenCalledOnce();
  });

  it('throws when location is invalid', async () => {
    const repo = new InMemoryReportRepository();
    const classifyReport = createMockClassifyReport();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(repo, createMockLogger(), classifyReport, clock);

    await expect(
      useCase.execute({
        title: 'Test',
        description: 'Invalid location',
        location: '',
      }),
    ).rejects.toThrow();
  });

  it('creates report even when AI classification fails (best-effort)', async () => {
    const repo = new InMemoryReportRepository();
    const failingClassify: ClassifyReportPort = {
      execute: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
    };
    const logger = createMockLogger();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(repo, logger, failingClassify, clock);

    const result = await useCase.execute({
      title: 'Pothole on Main St',
      description: 'Deep pothole near the bus stop',
      location: 'Main St & 2nd Ave',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Pothole on Main St');
    expect(result.category).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.technicalSummary).toBeNull();
    expect(result.newCategorySuggestion).toBeNull();
    expect(repo.items).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
