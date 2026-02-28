import { describe, it, expect, vi } from 'vitest';
import { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import type { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import { ClassificationStatus } from '../../../src/domain/reports/value-objects/classification-status.value-object';
import {
  InMemoryReportRepository,
  createMockLogger,
  createFakeClock,
  createMockQueueProducer,
} from '../../helpers';

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

    expect(result.id).toBe('test-uuid-1');
    expect(result.title).toBe('Broken street light');
    expect(result.description).toBe('Street light not working on 5th Avenue');
    expect(result.location).toBe('5th Avenue & Pine St');
    expect(result.classificationStatus).toBe(ClassificationStatus.PENDING);
    expect(result.category).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.technicalSummary).toBeNull();
    expect(result.createdAt).toEqual(new Date('2026-01-15T10:00:00Z'));
    expect(repo.items).toHaveLength(1);
    expect(queueProducer.publishClassificationJob).toHaveBeenCalledWith({
      reportId: 'test-uuid-1',
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
