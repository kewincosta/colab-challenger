import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DomainExceptionFilter } from '../../src/shared/filters/domain-exception.filter';

describe('Reports API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('/reports (POST) creates a report', async () => {
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
  });
});
