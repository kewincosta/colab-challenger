import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { QUEUE_PRODUCER_TOKEN } from '../../src/shared/constants/tokens';

const mockPublishJob = vi.fn();

describe('Reports API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(QUEUE_PRODUCER_TOKEN)
      .useValue({ publishClassificationJob: mockPublishJob })
      .compile();

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
    expect(response.body.newCategorySuggestion).toBeNull();
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
});
