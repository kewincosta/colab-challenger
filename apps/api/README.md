# Smart Municipal Service – AI-Powered Urban Triage (Backend)

## Overview

This project is a NestJS backend foundation for the **Smart Municipal Service – AI-Powered Urban Triage** platform. It receives citizen reports about urban issues, persists them to PostgreSQL, and is architected for future AI-based triage without coupling business logic to any specific LLM provider.

Current scope focuses on:

- Clean, modular, production-ready backend foundation.
- `POST /reports` endpoint to receive and persist reports.
- DDD + Clean Architecture with SOLID principles.
- TypeORM + PostgreSQL, Dockerized infrastructure.
- Swagger documentation and automated tests.

## Tech Stack

- Node.js
- NestJS
- TypeScript (strict mode)
- TypeORM
- PostgreSQL
- class-validator + class-transformer
- Swagger (OpenAPI)
- Jest + SuperTest
- Docker + Docker Compose

## Architecture Summary

- **Clean Architecture + DDD**
  - `src/domain` – Core domain model (entities, value objects, repository interfaces).
  - `src/application` – Use cases orchestrating domain logic.
  - `src/infrastructure` – TypeORM entities/repositories and technical adapters.
  - `src/presentation` – NestJS HTTP controllers, DTOs, validators.
  - `src/shared` – Config, logger, and shared constants.
- **Repository pattern**
  - Domain depends on `ReportRepository` interface.
  - Infrastructure implements it via `ReportTypeOrmRepository` with TypeORM.
- **NestJS modules**
  - `ReportsModule` wires controllers, use cases, and repositories.
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

## Running Locally (Node)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL (locally or via Docker). Example with Docker:

   ```bash
   docker compose up -d postgres
   ```

3. Set environment variables (or copy `.env.example` to `.env` and adjust):

   - `PORT` – API port (default `3000`).
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – PostgreSQL connection.

4. Start the API in development mode:

   ```bash
   npm run start
   ```

The API will be available at `http://localhost:3000/api`.

## Running with Docker Compose

1. Copy `.env.example` to `.env` if needed and adjust values.

2. Build and start services:

   ```bash
   docker compose up --build
   ```

3. The NestJS app will be exposed at `http://localhost:3000/api`.

## API – POST /reports

- **Endpoint**: `POST /api/reports`
- **Body**:

  ```json
  {
    "title": "Pothole on Main Street",
    "description": "Large pothole causing traffic delays near the intersection.",
    "location": "Main St & 3rd Ave, Springfield"
  }
  ```

  or

  ```json
  {
    "title": "Overflowing trash can",
    "description": "Trash can overflowing in central park.",
    "location": {
      "latitude": -23.55052,
      "longitude": -46.633308,
      "address": "Central Park, Sector 5"
    }
  }
  ```

- **Response** (`201 Created`):

  ```json
  {
    "id": "<uuid>",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "title": "Pothole on Main Street",
    "description": "Large pothole causing traffic delays near the intersection.",
    "location": "Main St & 3rd Ave, Springfield"
  }
  ```

## Swagger Documentation

- Swagger UI is available at:

  - `http://localhost:3000/api/docs`

The `CreateReportDto` and controller endpoints are decorated with OpenAPI metadata and example payloads.

## Tests

- Run all tests:

  ```bash
  npm test
  ```

- Run tests in watch mode:

  ```bash
  npm run test:watch
  ```

- Test types:
  - Unit tests: domain, application, and repository mapping.
  - Integration test: `POST /api/reports` via SuperTest.

Note: Integration tests expect a reachable PostgreSQL instance based on configured environment variables.

## Folder Structure (High Level)

```text
src/
  domain/
    reports/
      entities/
      value-objects/
      repositories/
  application/
    reports/
      use-cases/
  infrastructure/
    database/
      typeorm/
        entities/
        repositories/
  presentation/
    http/
      controllers/
      dto/
      validators/
      reports/
  shared/
    config/
    logger/
    constants/
docs/
  ARCHITECTURE.md
  BACKEND_GUIDELINES.md
  AI_FIRST_CONTEXT.md
test/
  unit/
  integration/
```

## Architectural Decisions (Why)

- **NestJS**: Provides a modular, opinionated foundation with DI and decorators that aligns well with Clean Architecture.
- **DDD + Clean Architecture**: Keeps the core model and workflows independent from frameworks, enabling long-term maintainability and AI-first evolution.
- **TypeORM + PostgreSQL**: Mature ORM and database combination with strong tooling and JSONB support for flexible location and AI metadata.
- **Repository pattern**: Decouples business logic from persistence and makes it easy to test with in-memory or mocked repositories.
- **Strict TypeScript**: Enforces type safety and reduces runtime errors, which is especially important when integrating AI services later.
