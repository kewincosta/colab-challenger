import { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import { ReportRepository } from '../../../src/domain/reports/repositories/report.repository';
import { Report } from '../../../src/domain/reports/entities/report.entity';
import { Location } from '../../../src/domain/reports/value-objects/location.value-object';
import { AppLoggerPort } from '../../../src/application/ports/logger.port';

class InMemoryReportRepository implements ReportRepository {
  public items: Report[] = [];

  async save(report: Report): Promise<Report> {
    const restored = Report.restore(
      {
        title: report.getTitle(),
        description: report.getDescription(),
        location: report.getLocation(),
        createdAt: report.getCreatedAt(),
      },
      'test-id',
    );
    this.items.push(restored);
    return restored;
  }
}

const mockLogger: AppLoggerPort = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('CreateReportUseCase', () => {
  it('creates and persists a report', async () => {
    const repo = new InMemoryReportRepository();
    const useCase = new CreateReportUseCase(repo, mockLogger);

    const result = await useCase.execute({
      title: 'Broken street light',
      description: 'Street light not working on 5th Avenue',
      location: '5th Avenue & Pine St',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Broken street light');
    expect(result.description).toBe('Street light not working on 5th Avenue');
    expect(result.location).toBe('5th Avenue & Pine St');
    expect(repo.items).toHaveLength(1);
  });

  it('throws when location is invalid', async () => {
    const repo = new InMemoryReportRepository();
    const useCase = new CreateReportUseCase(repo, mockLogger);

    await expect(
      useCase.execute({
        title: 'Test',
        description: 'Invalid location',
        location: '',
      }),
    ).rejects.toThrow();
  });
});
