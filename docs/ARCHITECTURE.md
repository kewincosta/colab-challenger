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
  - `reports/entities` – Domain entities such as `Report`.
  - `reports/value-objects` – Domain value objects such as `Location`.
  - `reports/repositories` – Repository interfaces (e.g., `ReportRepository`).
- `src/application`
  - `reports/use-cases` – Use cases such as `CreateReportUseCase` orchestrating domain logic.
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
- `Report` entity encapsulates invariants (non-empty title/description, valid location) and behavior (`updateDescription`, `moveTo`).
- `Location` value object encapsulates rules around how a location is represented (string or structured object) and ensures validity.
- Domain is completely **framework-agnostic**: no NestJS decorators, no TypeORM imports, no HTTP knowledge.

### Application Layer

- Contains **use cases** implementing application-specific workflows.
- `CreateReportUseCase` accepts a simple command object and coordinates entity creation and persistence via `ReportRepository`.
- The layer is pure TypeScript and depends only on domain interfaces and entities, not on NestJS or TypeORM.

### Infrastructure Layer

- Contains all **technical details**: database access, TypeORM entities, external services (future: AI providers, queues, etc.).
- `ReportOrmEntity` maps the `Report` aggregate to a `reports` table using PostgreSQL types, including JSONB for location.
- `ReportTypeOrmRepository` implements `ReportRepository` by mapping between domain objects and `ReportOrmEntity` and delegating to TypeORM.

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

## 4. AI Integration Support

This architecture is designed to be **AI-first friendly**:

- Future AI triage will live in the **application layer** as use cases or services orchestrating AI calls.
- A `TriageService` interface can be defined in the domain/application and implemented in the infrastructure layer as an `LlmTriageAdapter`.
- HTTP controllers and DTOs will remain unaware of specific LLM providers; they will only interact with application-level contracts.
- The existing `Report` entity and `Location` value object can be extended with AI triage metadata (severity, recommended department, SLA) without changing controllers.

## 5. Trade-offs

- The project starts with **one feature (reports)** but already applies full DDD + Clean Architecture. This is more structure than a minimal CRUD API, but it pays off as more services (triage, notifications, workflows) are added.
- `synchronize: true` is enabled for TypeORM in this PoC to simplify onboarding. In production, migrations should replace this for safety and control.
- Only the write path (`POST /reports`) is implemented initially. Read paths and search capabilities can be layered on with additional use cases.
- Error handling is intentionally simple (basic exceptions). In a production system, domain-specific error types and exception filters should be introduced.

## 6. Scalability Considerations

- **Horizontal scaling**: The NestJS app is stateless; state is persisted in PostgreSQL. Multiple instances can be run behind a load balancer.
- **Database**: PostgreSQL with JSONB for `location` allows flexible schemas and future AI-enriched metadata without schema churn.
- **Module boundaries**: New bounded contexts (e.g., `triage`, `notifications`, `users`) can be added as new domain/application/infrastructure/presentation subtrees and NestJS modules.
- **Performance**: Use cases keep logic local; database access is isolated in repositories, making it straightforward to optimize queries or introduce caching at the infrastructure layer.

## 7. Testing Strategy

- **Unit tests** focus on domain and application:
  - `CreateReportUseCase` is tested with an in-memory repository implementation.
  - `ReportTypeOrmRepository` is tested by mocking the underlying TypeORM repository to validate mapping behavior.
- **Integration tests** use NestJS testing utilities and SuperTest:
  - `reports.e2e-spec.ts` boots an `INestApplication` and exercises `POST /api/reports` end-to-end.
- Future tests:
  - Contract tests for AI adapters.
  - Database integration tests for complex queries.

## 8. Database Design Decisions

- Single table `reports` for now, modeled via `ReportOrmEntity`:
  - `id` – UUID primary key.
  - `title` – short textual summary.
  - `description` – detailed description.
  - `location` – JSONB field storing either a string or structured object.
  - `created_at` – creation timestamp.
- **JSONB location** provides flexibility for storing coordinates, addresses, and AI-enriched geospatial metadata without schema changes.
- In the future, normalized tables (e.g., `locations`, `triage_results`) can be introduced while keeping `Report` as the aggregate root.

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

