# Smart Municipal Service – Backend Architecture

## 1. Architectural Style

- **Clean Architecture** is used to keep business rules independent from frameworks, databases, and external systems. The innermost layers (domain, application) contain the core model and use cases and can be tested and evolved without touching NestJS, HTTP, or TypeORM.
- **Domain-Driven Design (DDD)** guides how we model the core concepts of the platform (reports, locations, triage in the future). The domain layer captures ubiquitous language and invariants (e.g., non-empty titles, valid locations) in rich entities and value objects instead of anemic data structures.
- The **Repository pattern** abstracts persistence, allowing the domain and application layers to depend only on interfaces. TypeORM-based repositories live in the infrastructure layer and implement these interfaces, so we can swap databases or ORMs with minimal impact.
- **TypeORM** is selected because it integrates well with NestJS, supports PostgreSQL, and offers strong tooling for migrations and entity management. It is used strictly in the infrastructure layer.
- **Modular NestJS**: The NestJS module system is used to group controllers, use cases, and infrastructure adapters around bounded contexts (e.g., ReportsModule). This aligns with DDD subdomains and enables incremental growth of the platform.

## 2. Layers Overview

Project layout (core parts only):

- `src/domain`
  - `reports/entities` – Domain entities: `Report` (input + job control) and `ClassificationResult` (AI output + triage).
  - `reports/value-objects` – Domain value objects: `Location`, `ClassificationStatus`, `TriageStatus`.
  - `reports/repositories` – Repository interfaces (`ReportRepository`, `ClassificationResultRepository`).
- `src/application`
  - `reports/use-cases` – Use cases such as `CreateReportUseCase` orchestrating domain logic.
  - `ai/use-cases` – AI orchestration use cases such as `ClassifyReportUseCase`.
  - `ai/prompt-builder` – Pure functions for prompt construction (system instruction, user message, repair). Contains business rules (taxonomy, priorities, classification criteria) — provider-agnostic.
  - `ai/types` – AI classification types, taxonomy constants, and enrichment input/output contracts.
  - `ai/validators` – Zod schemas for AI response validation and JSON schema derivation.
  - `ports/` – Abstractions consumed by use cases (`AiClientPort`, `ReportRepository`, `AiCache`, etc.).
- `src/infrastructure`
  - `database/typeorm/entities` – TypeORM entities mapping domain to PostgreSQL tables.
  - `database/typeorm/repositories` – Concrete repository implementations.
- `src/presentation`
  - `http/controllers` – Thin NestJS controllers exposing REST endpoints.
  - `http/dto` – Transport-layer DTOs with validation and Swagger decorators.
  - `http/validators` – Custom validation constraints.
- `src/shared`
  - `config` – Cross-cutting configuration (TypeORM, env-based settings).
  - `logger` – Logging abstractions.
  - `constants` – Shared tokens for DI.

### Domain Layer

- Contains the **core model** and business rules.
- `Report` entity encapsulates invariants (non-empty title/description, valid location) and holds **classification job control** fields (`classificationStatus`, `classificationAttempts`, `lastClassificationError`) since these describe the report's processing lifecycle. Lifecycle methods (`startClassification()`, `completeClassification()`, `failClassification()`) encapsulate state transitions.
- `ClassificationResult` entity stores the **AI classification output** (`category`, `priority`, `technicalSummary`) as a separate, immutable record with a `triageStatus` field (defaults to `PENDING`) for future manual review workflows. It has a 1:0..1 relationship with `Report` — created only when classification succeeds.
- `Location` value object encapsulates a structured address (`street`, `neighborhood`, `city`, `state`, `postcode`, optional `number`/`complement`) and ensures validity by requiring non-empty mandatory fields.
- `TriageStatus` value object models the future manual triage workflow (currently only `PENDING`).
- Domain is completely **framework-agnostic**: no NestJS decorators, no TypeORM imports, no HTTP knowledge.

### Application Layer

- Contains **use cases** implementing application-specific workflows.
- `CreateReportUseCase` accepts a simple command object and coordinates entity creation and persistence via `ReportRepository`.
- `ClassifyReportUseCase` orchestrates AI classification: builds prompts via pure functions in `prompt-builder`, calls `AiClientPort.generate()` with ready-to-send text and JSON schema, validates responses with Zod, and handles repair retries.
- `prompt-builder` contains pure functions encoding business rules (municipal taxonomy, priority guidelines, anti-hallucination rules). It is provider-agnostic — no Gemini, OpenAI, or framework imports.
- The layer is pure TypeScript and depends only on domain interfaces and entities, not on NestJS or TypeORM.

### Infrastructure Layer

- Contains all **technical details**: database access, TypeORM entities, external service adapters, cache.
- `ReportOrmEntity` maps the `Report` aggregate to a `reports` table (input data + job control fields).
- `ClassificationResultOrmEntity` maps AI output to a `classification_results` table with a unique FK to `reports`.
- `ReportTypeOrmRepository` and `ClassificationResultTypeOrmRepository` implement their respective repository ports.
- `GeminiClient` implements `AiClientPort` as a pure adapter: receives ready-to-send strings (system instruction + user message) and an optional JSON schema, forwards them to the Gemini API, and returns raw text. It contains no prompt construction or business rules.
- `RedisCacheAdapter` implements `AiCache<T>` using ioredis with JSON serialization, TTL via `SETEX`, and `ai-cache:` key prefix namespacing.

### Presentation Layer

- Contains **NestJS HTTP adapters** only.
- `ReportsController` exposes `POST /reports` and delegates to `CreateReportUseCase`.
- DTOs such as `CreateReportDto` define request/response contracts and use `class-validator` / `class-transformer` and Swagger decorators.
- Controllers remain thin: no business logic, no persistence code; only mapping from HTTP to application use cases.

## 3. Dependency Rules

The dependency flow is strictly **inward**:

- Presentation → Application → Domain
- Infrastructure → Domain

Rules:

- **Domain** depends on nothing from NestJS, TypeORM, or external libraries beyond the language/runtime.
- **Application** depends only on domain entities and repository interfaces.
- **Infrastructure** implements domain repositories and uses TypeORM, but domain/application are unaware of these details.
- **Presentation** depends on application use cases, DTOs, and NestJS decorators, but not on infrastructure details.

NestJS DI wiring (modules/providers) lives at the edges (presentation/infrastructure), ensuring that domain and application can be reused in other environments (CLI, message consumers, tests) without change.

## 4. AI Integration

The AI classification pipeline follows Clean Architecture strictly:

- **Prompt construction** lives in the **application layer** (`ai/prompt-builder.ts`) as pure functions. These encode business rules: municipal taxonomy, priority guidelines, conflict resolution, anti-hallucination rules, and input security. They are completely provider-agnostic.
- **`ClassifyReportUseCase`** (application layer) orchestrates the full flow: builds system instruction + user message, calls `AiClientPort.generate()`, validates the JSON response with Zod, and triggers repair retries when needed. It passes the JSON schema as a parameter, keeping the AI client decoupled from specific response structures.
- **`AiClientPort`** is a minimal port with a single `generate(systemInstruction, userMessage, responseJsonSchema?)` method. It receives ready-to-send text and returns raw text — no knowledge of reports, taxonomy, or classification.
- **`GeminiClient`** (infrastructure layer) implements `AiClientPort`. It handles only Gemini-specific concerns: SDK initialization, timeout/abort, safety filters, structured output mode. Swapping to another provider (OpenAI, Anthropic) requires only a new adapter — prompts and validation remain unchanged.
- **`ProcessClassificationUseCase`** (application layer) consumes `ClassifyReportPort` (implemented by `ClassifyReportUseCase`) to process BullMQ jobs. It manages the report lifecycle (fetch → classify → persist result separately → mark report DONE) without knowledge of AI internals. On success, it creates a `ClassificationResult` entity and saves it via `ClassificationResultRepository`, cleanly separating input data from AI output.
- **AI cache** uses Redis via `RedisCacheAdapter` (implementing `AiCache<T>` port) for deduplication of identical classification requests. The cache port is fully async to support both in-memory and Redis backends.

## 5. Trade-offs

- The project starts with **one feature (reports)** but already applies full DDD + Clean Architecture. This is more structure than a minimal CRUD API, but it pays off as more services (triage, notifications, workflows) are added.
- `synchronize: true` is enabled for TypeORM in this PoC to simplify onboarding. In production, migrations should replace this for safety and control.
- Only the write path (`POST /reports`) is implemented initially. Read paths and search capabilities can be layered on with additional use cases.
- Error handling is intentionally simple (basic exceptions). In a production system, domain-specific error types and exception filters should be introduced.

## 6. Scalability Considerations

- **Horizontal scaling**: The NestJS app is stateless; state is persisted in PostgreSQL. Multiple instances can be run behind a load balancer.
- **Database**: PostgreSQL with JSONB for `location` stores the structured address object. Multiple instances can be run behind a load balancer.
- **Module boundaries**: New bounded contexts (e.g., `triage`, `notifications`, `users`) can be added as new domain/application/infrastructure/presentation subtrees and NestJS modules.
- **Performance**: Use cases keep logic local; database access is isolated in repositories, making it straightforward to optimize queries or introduce caching at the infrastructure layer.

## 7. Testing Strategy

- **Unit tests** (20 files) focus on domain, application, infrastructure, and presentation:
  - Domain entities and value objects (`Report`, `ClassificationResult`, `Location`, `ReportTitle`, `ReportDescription`).
  - Application use cases with injected mocks (`CreateReportUseCase`, `ProcessClassificationUseCase`, `ClassifyReportUseCase`).
  - AI pipeline: prompt builder, normalization, validators, mapper.
  - Infrastructure: TypeORM repository mapping, Gemini client (SDK mocks), Redis cache adapter.
  - Presentation: controller delegation, DTO validation, env validation, exception filter.
- **Integration tests** (2 files) use NestJS testing utilities and SuperTest:
  - `reports.spec.ts` boots an `INestApplication` and exercises `POST /api/reports` end-to-end.
  - `process-classification.spec.ts` tests 5 scenarios with in-memory repositories: happy path, report not found, idempotency, AI failure → FAILED, retry of FAILED → DONE.
- Future tests:
  - Contract tests for AI adapters.
  - Database integration tests for complex queries.

## 8. Database Design Decisions

### ID Strategy: Integer Internal + External UUID

Both tables use a **dual-key strategy**:

| Column | Type | Purpose |
|---|---|---|
| `id` | `integer` (auto-increment) | Internal PK — sequential clustered index, optimized for write performance and joins |
| `external_id` | `uuid` (v4, unique) | API-facing ID — non-enumerable, safe for public exposure |

The domain layer works exclusively with `external_id` (string UUID) as its identifier. The integer `id` never escapes the infrastructure layer (ORM/repository). This provides database performance (sequential B-tree inserts, 4-byte joins) while preventing IDOR attacks via non-guessable public IDs.

### Table Structure

- Two tables model the report + classification flow:
  - **`reports`** — input data submitted by the citizen + classification job control:
    - `id` – integer auto-increment primary key.
    - `external_id` – UUID v4 (unique, generated by the database).
    - `title` – short textual summary.
    - `description` – detailed description.
    - `location` – JSONB field storing a structured address object.
    - `classification_status` – job status (`PENDING`, `PROCESSING`, `DONE`, `FAILED`).
    - `classification_attempts` – retry counter.
    - `last_classification_error` – last failure message (nullable).
    - `created_at` – creation timestamp.
  - **`classification_results`** — AI classification output (created only on success):
    - `id` – integer auto-increment primary key.
    - `external_id` – UUID v4 (unique, generated by the database).
    - `report_external_id` – FK referencing `reports.external_id` (UNIQUE, 1:0..1 relationship).
    - `category` – AI-assigned category.
    - `priority` – AI-assigned priority.
    - `technical_summary` – AI-generated summary.
    - `triage_status` – manual review status (defaults to `PENDING` for future workflow).
    - `created_at`, `updated_at` – timestamps.

### Repository Mapping

```
Domain (entity.id)  ↔  ORM (entity.externalId)   — UUID exposed in the API
                       ORM (entity.id)            — internal integer (never exposed)
```

`findById()` queries by `externalId`; `toOrmEntity()` resolves existing records by `externalId` to preserve the internal `id` on updates.

- This separation follows **SRP**: Report holds what the citizen submitted + processing state; ClassificationResult holds what the AI produced + future triage state.
- **JSONB location** stores the structured address object (`street`, `neighborhood`, `city`, `state`, `postcode`) as a single column, avoiding multiple nullable address columns.
- Redis is used for AI response caching via `RedisCacheAdapter`, sharing the same Redis instance as BullMQ.

## 9. Safe Extension Guidelines

- Add new features by introducing:
  - New domain entities/value objects in `src/domain/<context>`.
  - New use cases in `src/application/<context>/use-cases`.
  - New repository interfaces and implementations as needed.
  - New NestJS modules, controllers, and DTOs in `src/presentation/http`.
- Avoid leaking HTTP or TypeORM concerns into domain/application.
- Use DI tokens (e.g., `REPORT_REPOSITORY_TOKEN`) to bind interfaces to implementations at the module level.

## 10. Security Considerations

- **Authentication & Authorization** (future):
  - Guard-based auth (e.g., JWT, API keys) can be added at the controller level using NestJS guards without impacting domain/application.
  - Role-based access control can be implemented via custom decorators and guards.
- **Rate limiting** (future):
  - NestJS interceptors or API Gateway-level throttling to protect against abuse.
- **Input validation**:
  - Global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted` prevents unexpected payloads.
- **Data protection**:
  - PostgreSQL should be deployed with TLS and proper network policies in production.
  - Sensitive logs should be scrubbed at the logger level.

