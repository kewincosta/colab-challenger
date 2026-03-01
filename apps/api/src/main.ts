import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Smart Municipal Service – Urban Triage API')
    .setDescription(
      'Backend API for receiving and managing citizen urban issue reports.\n\n' +
        '**Overview:**\n' +
        'This API allows citizens to submit reports about urban issues (potholes, broken streetlights, ' +
        'illegal dumping, etc.). Each report is automatically queued for AI-powered classification ' +
        'that determines category, priority, and the responsible department.\n\n' +
        '**How it works:**\n' +
        '1. A citizen submits a report via `POST /api/reports` with a title, description, and structured address\n' +
        '2. The API validates the payload, persists the report, and returns it with `classificationStatus: PENDING`\n' +
        '3. A background worker picks up the report, sends it to an AI model for classification\n' +
        '4. The classification result (category, priority, department) is stored and the status moves to `DONE` or `FAILED`\n\n' +
        '**Error Format:**\n' +
        'All error responses follow a consistent shape:\n' +
        '```json\n' +
        '{\n' +
        '  "statusCode": 400,\n' +
        '  "message": ["field must not be empty"],\n' +
        '  "error": "Bad Request"\n' +
        '}\n' +
        '```',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Local Development')
    .addTag(
      'Reports',
      'Endpoints for creating and managing citizen urban issue reports.',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customCss:
      '.swagger-ui .topbar .download-url-wrapper { display: none }' +
      ' .swagger-ui .renderedMarkdown li { padding: 6px 0; color: white; }',
    customSiteTitle: 'Urban Triage API — Documentation',
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

void bootstrap();
