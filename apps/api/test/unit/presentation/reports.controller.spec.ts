import { describe, it, expect, vi } from 'vitest';
import { ReportsController } from '../../../src/presentation/http/controllers/reports.controller';
import type { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import type { CreateReportDto } from '../../../src/presentation/http/dto/create-report.dto';

function createMockCreateReportUseCase() {
  return {
    execute: vi.fn().mockResolvedValue({
      id: 'test-uuid',
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: '01310-100',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      classificationStatus: 'PENDING',
    }),
  } as unknown as CreateReportUseCase;
}

describe('ReportsController', () => {
  it('delegates to CreateReportUseCase and returns the mapped response', async () => {
    // Arrange
    const useCase = createMockCreateReportUseCase();
    const controller = new ReportsController(useCase);
    const dto: CreateReportDto = {
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: '01310-100',
    };

    // Act
    const result = await controller.createReport(dto);

    // Assert
    expect(useCase.execute).toHaveBeenCalledWith({
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: '01310-100',
    });
    expect(result.id).toBe('test-uuid');
    expect(result.title).toBe('Broken streetlight');
    expect(result.classificationStatus).toBe('PENDING');
    expect(result.createdAt).toEqual(new Date('2026-01-15T10:00:00Z'));
  });

  it('passes location object to use case unchanged', async () => {
    // Arrange
    const useCase = createMockCreateReportUseCase();
    const controller = new ReportsController(useCase);
    const objectLocation = { lat: -23.55, lng: -46.63 };
    const dto: CreateReportDto = {
      title: 'Pothole',
      description: 'Deep pothole.',
      location: objectLocation,
    };

    // Act
    await controller.createReport(dto);

    // Assert
    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ location: objectLocation }),
    );
  });
});
