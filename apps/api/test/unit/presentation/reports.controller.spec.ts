import { describe, it, expect, vi } from 'vitest';
import { ReportsController } from '../../../src/presentation/http/controllers/reports.controller';
import type { CreateReportUseCase } from '../../../src/application/reports/use-cases/create-report.use-case';
import type { CreateReportInput } from '../../../src/presentation/http/dto/create-report.schema';

const VALID_LOCATION = {
  street: 'Praça da Sé',
  number: '123',
  neighborhood: 'Sé',
  city: 'São Paulo',
  state: 'SP',
  postcode: '01001-000',
};

function createMockCreateReportUseCase() {
  return {
    execute: vi.fn().mockResolvedValue({
      id: 'test-uuid',
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: VALID_LOCATION,
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
    const dto: CreateReportInput = {
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: VALID_LOCATION,
    };

    // Act
    const result = await controller.createReport(dto);

    // Assert
    expect(useCase.execute).toHaveBeenCalledWith({
      title: 'Broken streetlight',
      description: 'Light out for 3 days.',
      location: VALID_LOCATION,
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
    const locationWithoutNumber = {
      street: 'Rua Sem Número',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postcode: '01001-000',
    };
    const dto: CreateReportInput = {
      title: 'Pothole',
      description: 'Deep pothole.',
      location: locationWithoutNumber,
    };

    // Act
    await controller.createReport(dto);

    // Assert
    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ location: locationWithoutNumber }),
    );
  });
});
