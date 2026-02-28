import { describe, it, expect, vi } from 'vitest';
import { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import type { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';
import type { AppLoggerPort } from '../../../src/application/ports/logger.port';
import type { QueueProducerPort } from '../../../src/application/ports/queue-producer.port';
import type { ClockPort } from '../../../src/application/ports/clock.port';

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
        classificationStatus: report.getClassificationStatus(),
        classificationAttempts: report.getClassificationAttempts(),
        lastClassificationError: report.getLastClassificationError(),
        classifiedAt: report.getClassifiedAt(),
      },
      'test-id',
    );
    this.items.push(restored);
    return restored;
  }

  async findById(id: string): Promise<Report | null> {
    return this.items.find((r) => r.getId() === id) ?? null;
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

function createMockQueueProducer(): QueueProducerPort {
  return {
    publishClassificationJob: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CreateReportUseCase', () => {
  it('creates a report with PENDING status and publishes classification job', async () => {
    const repo = new InMemoryReportRepository();
    const queueProducer = createMockQueueProducer();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(repo, createMockLogger(), queueProducer, clock);

    const result = await useCase.execute({
      title: 'Broken street light',
      description: 'Street light not working on 5th Avenue',
      location: '5th Avenue & Pine St',
    });

    expect(result.id).toBe('test-id');
    expect(result.title).toBe('Broken street light');
    expect(result.description).toBe('Street light not working on 5th Avenue');
    expect(result.location).toBe('5th Avenue & Pine St');
    expect(result.classificationStatus).toBe(ClassificationStatus.PENDING);
    expect(result.category).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.technicalSummary).toBeNull();
    expect(result.newCategorySuggestion).toBeNull();
    expect(result.createdAt).toEqual(new Date('2026-01-15T10:00:00Z'));
    expect(repo.items).toHaveLength(1);
    expect(queueProducer.publishClassificationJob).toHaveBeenCalledWith({
      reportId: 'test-id',
    });
  });

  it('throws when location is invalid', async () => {
    const repo = new InMemoryReportRepository();
    const queueProducer = createMockQueueProducer();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(repo, createMockLogger(), queueProducer, clock);

    await expect(
      useCase.execute({
        title: 'Test',
        description: 'Invalid location',
        location: '',
      }),
    ).rejects.toThrow();
  });

  it('does not publish job if persistence fails', async () => {
    const failingRepo: ReportRepository = {
      save: vi.fn().mockRejectedValue(new Error('DB connection lost')),
      findById: vi.fn(),
    };
    const queueProducer = createMockQueueProducer();
    const clock = createFakeClock();
    const useCase = new CreateReportUseCase(failingRepo, createMockLogger(), queueProducer, clock);

    await expect(
      useCase.execute({
        title: 'Pothole on Main St',
        description: 'Deep pothole near the bus stop',
        location: 'Main St & 2nd Ave',
      }),
    ).rejects.toThrow('DB connection lost');

    expect(queueProducer.publishClassificationJob).not.toHaveBeenCalled();
  });
});
