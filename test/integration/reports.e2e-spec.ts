import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DomainExceptionFilter } from '../../src/shared/filters/domain-exception.filter';
import { AI_ENRICHMENT_SERVICE_TOKEN } from '../../src/shared/constants/tokens';

const mockClassifyReport = {
  execute: async () => ({
    category: 'Waste',
    new_category_suggestion: null,
    priority: 'Medium',
    technical_summary: 'Overflowing waste container requiring scheduled collection.',
  }),
};

describe('Reports API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_ENRICHMENT_SERVICE_TOKEN)
      .useValue(mockClassifyReport)
      .compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalFilters(new DomainExceptionFilter());

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

  afterAll(async () => {
    await app.close();
  });

  it('/reports (POST) creates a report with AI classification', async () => {
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
    expect(response.body.category).toBe('Waste');
    expect(response.body.priority).toBe('Medium');
    expect(response.body.technicalSummary).toBe(
      'Overflowing waste container requiring scheduled collection.',
    );
    expect(response.body.newCategorySuggestion).toBeNull();
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

  it('/reports (POST) creates report even when AI fails', async () => {
    // Override the mock to simulate failure for this specific test
    const originalExecute = mockClassifyReport.execute;
    mockClassifyReport.execute = async () => {
      throw new Error('AI service unavailable');
    };

    try {
      const response = await request(app.getHttpServer())
        .post('/api/reports')
        .send({
          title: 'Broken traffic light',
          description: 'Traffic light stuck on red at Main St intersection',
          location: 'Main St & Oak Ave',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Broken traffic light');
      expect(response.body.category).toBeNull();
      expect(response.body.priority).toBeNull();
      expect(response.body.technicalSummary).toBeNull();
      expect(response.body.newCategorySuggestion).toBeNull();
    } finally {
      mockClassifyReport.execute = originalExecute;
    }
  });
});
