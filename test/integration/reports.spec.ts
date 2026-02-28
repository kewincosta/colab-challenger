import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { type INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ReportsController } from '../../src/presentation/http/controllers/reports.controller';
import { CreateReportUseCase } from '../../src/application/reports/use-cases/create-report.use-case';
import { DomainExceptionFilter } from '../../src/shared/filters/domain-exception.filter';
import {
  REPORT_REPOSITORY_TOKEN,
  APP_LOGGER_TOKEN,
  QUEUE_PRODUCER_TOKEN,
  CLOCK_TOKEN,
} from '../../src/shared/constants/tokens';
import {
  InMemoryReportRepository,
  createMockLogger,
  createFakeClock,
  createMockQueueProducer,
} from '../helpers';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockQueueProducer = createMockQueueProducer();
const mockPublishJob = mockQueueProducer.publishClassificationJob as ReturnType<typeof vi.fn>;
const mockLogger = createMockLogger();
const mockClock = createFakeClock();
const inMemoryRepo = new InMemoryReportRepository();

// ── Self-contained test module (no DB, no Redis, no Gemini) ───────────

@Module({
  controllers: [ReportsController],
  providers: [
    { provide: APP_LOGGER_TOKEN, useValue: mockLogger },
    { provide: QUEUE_PRODUCER_TOKEN, useValue: mockQueueProducer },
    { provide: CLOCK_TOKEN, useValue: mockClock },
    { provide: REPORT_REPOSITORY_TOKEN, useValue: inMemoryRepo },
    {
      provide: CreateReportUseCase,
      useValue: new CreateReportUseCase(inMemoryRepo, mockLogger, mockQueueProducer, mockClock),
    },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
class TestReportsModule {}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Reports API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestReportsModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    mockPublishJob.mockReset();
    mockPublishJob.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/reports (POST) creates a report with PENDING classification', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/reports')
      .send({
        title: 'Overflowing trash can',
        description: 'Trash can overflowing in central park',
        location: {
          latitude: -23.55052,
          longitude: -46.633308,
          address: 'Central Park, Sector 5',
        },
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.title).toBe('Overflowing trash can');
    expect(response.body.description).toBe('Trash can overflowing in central park');
    expect(response.body.classificationStatus).toBe('PENDING');
    expect(response.body.category).toBeNull();
    expect(response.body.priority).toBeNull();
    expect(response.body.technicalSummary).toBeNull();
    expect(mockPublishJob).toHaveBeenCalledWith({
      reportId: response.body.id,
    });
  });

  it('/reports (POST) returns 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .send({
        title: '',
        description: '',
        location: '',
      })
      .expect(400);
  });

  it('/reports (POST) publishes classification job with correct payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/reports')
      .send({
        title: 'Broken traffic light',
        description: 'Traffic light stuck on red at Main St intersection',
        location: 'Main St & Oak Ave',
      })
      .expect(201);

    expect(mockPublishJob).toHaveBeenCalledOnce();
    expect(mockPublishJob).toHaveBeenCalledWith({
      reportId: response.body.id,
    });
  });

  it('/reports (POST) returns 422 when domain validation fails (empty title after trim)', async () => {
    await request(app.getHttpServer())
      .post('/api/reports')
      .send({
        title: '   ',
        description: 'Valid description',
        location: 'Valid location',
      })
      .expect(422);
  });

  it('/reports (POST) returns 201 with structured location object', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/reports')
      .send({
        title: 'Pothole on Main St',
        description: 'Deep pothole causing traffic slowdowns',
        location: {
          latitude: -23.55052,
          longitude: -46.633308,
        },
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.location).toEqual({
      latitude: -23.55052,
      longitude: -46.633308,
    });
    expect(response.body.classificationStatus).toBe('PENDING');
  });

  it('/reports (POST) does not publish job when queue fails', async () => {
    mockPublishJob.mockRejectedValueOnce(new Error('Queue unavailable'));

    await expect(
      request(app.getHttpServer()).post('/api/reports').send({
        title: 'Street flooding',
        description: 'Water flooding the intersection after heavy rain',
        location: 'Rua Augusta & Av. Paulista',
      }),
    ).resolves.toBeDefined();

    // The queue failure propagates as a 500
    // Report was persisted but the job publish failed
    expect(mockPublishJob).toHaveBeenCalledOnce();
  });
});
