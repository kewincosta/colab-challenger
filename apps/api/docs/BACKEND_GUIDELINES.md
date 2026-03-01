# Backend Engineering Guidelines

These guidelines define how to extend and maintain the Smart Municipal Service backend. They are intended as an internal handbook, onboarding document, and AI instruction prompt for future automation.

## 1. Folder Structure Conventions

- `src/domain` – Pure domain model and business rules.
- `src/application` – Use cases orchestrating domain logic.
- `src/infrastructure` – Technical implementations (database, external services, AI adapters, etc.).
- `src/presentation` – HTTP (and future transport) adapters, controllers, DTOs.
- `src/shared` – Cross-cutting concerns (config, logging, constants).
- `test/unit` – Unit tests per layer.
- `test/integration` – End-to-end and integration tests.

Always follow this layering for new features.

## 2. Naming Conventions

- Entities: `Report`, `User`, `TriageResult` – singular, PascalCase.
- Value objects: `Location`, `PriorityLevel` – PascalCase with `value-object` filename suffix.
- Use cases: `CreateReportUseCase` – PascalCase with `.use-case.ts` suffix.
- Repositories: `ReportRepository` (interface), `ReportTypeOrmRepository` (implementation).
- DTOs: `CreateReportDto`, `ReportResponseDto` – PascalCase with `.dto.ts` suffix.
- Controllers: `ReportsController` – plural, suffixed with `Controller`.
- Modules: `ReportsModule` – PascalCase with `.module.ts` file when applicable.
- Tests: mirror the source path under `test/`, suffix with `.spec.ts` or `.e2e-spec.ts`.

## 3. Creating a New Feature Module

1. **Domain layer**
   - Add a new folder under `src/domain/<feature>`.
   - Define entities, value objects, and repository interfaces.
2. **Application layer**
   - Add use cases under `src/application/<feature>/use-cases`.
   - Each use case should expose a single public method `execute`.
3. **Infrastructure layer**
   - Add TypeORM entities and repositories under `src/infrastructure/database/typeorm` (or another technology-specific folder).
   - Implement the domain repository interfaces.
4. **Presentation layer**
   - Create DTOs and controllers under `src/presentation/http`.
   - Wire everything in a dedicated NestJS module (e.g., `FeatureModule`).

## 4. Adding New Use Cases

- Create a file under `src/application/<feature>/use-cases`.
- The use case should:
  - Depend only on domain interfaces/entities.
  - Have a clearly defined input command and output result type.
  - Perform business-orchestration logic, not HTTP or persistence details.
- Register the use case as a provider in the corresponding Nest module using a factory that injects domain repositories or services.

## 5. Implementing New Repositories

- Define an interface in `src/domain/<feature>/repositories`.
- Implement it in `src/infrastructure/<tech>/repositories`.
- Keep mapping between domain entities and persistence entities inside the repository implementation.
- Expose the implementation via DI tokens in the module (e.g., `USER_REPOSITORY_TOKEN`).

## 6. Writing Tests

- **Unit tests**:
  - Target individual use cases, entities, and repository implementations.
  - Use in-memory or mocked dependencies (no real DB or network calls).
- **Integration tests**:
  - Use Nest TestingModule and SuperTest for HTTP endpoints.
  - Optionally connect to a real test database or a Dockerized environment.
- Use descriptive test names and organize tests by feature.

## 7. Maintaining Clean Architecture

- Domain must not import from NestJS, TypeORM, or transport libraries.
- Application must not depend on controllers, DTOs, or TypeORM.
- Controllers must call use cases and map inputs/outputs only; no business logic.
- Repositories in infrastructure must implement interfaces from domain and not leak ORM details outward.

## 8. SOLID Principles in This Project

- **Single Responsibility**: Each class has one reason to change (e.g., `CreateReportUseCase` only coordinates creating reports).
- **Open/Closed**: New behavior is added via new use cases, entities, or repository implementations rather than modifying existing code.
- **Liskov Substitution**: Interfaces like `ReportRepository` can be implemented by in-memory or TypeORM repositories transparently.
- **Interface Segregation**: Keep repository interfaces small and focused on aggregate needs.
- **Dependency Inversion**: High-level modules (use cases) depend on abstractions (interfaces), not concrete implementations.

## 9. DTO Best Practices

- DTOs live in `src/presentation/http/dto`.
- They should:
  - Contain only transport-level concerns.
  - Use `class-validator` decorators for input validation.
  - Use `@ApiProperty` decorators for Swagger documentation.
- Avoid placing business logic in DTOs; they are mapping and validation objects only.

## 10. Validation Standards

- Use a global `ValidationPipe` configured with:
  - `whitelist: true` – strip unknown properties.
  - `transform: true` – transform payloads into DTO instances.
  - `forbidNonWhitelisted: true` – reject unexpected properties.
- Prefer explicit validation decorators and custom validators for complex cases (e.g., `LocationFormatConstraint`).

## 11. Error Handling Strategy

- Use domain-level errors for business rule violations where appropriate.
- At the NestJS layer, use exception filters (future) to map errors to meaningful HTTP responses.
- For now, standard NestJS HTTP exceptions and global error handling are sufficient for the PoC.

## 12. Logging Standards

- Use `AppLogger` (or future logger adapters) instead of `console.log`.
- Log meaningful events:
  - Report creation and failures.
  - Interactions with external systems (e.g., AI triage services).
- Avoid logging sensitive data (e.g., user identifiers beyond what is needed).

## 13. Introducing AI Integration Safely

- Define AI-facing interfaces (e.g., `TriageService`) in the application/domain layer.
- Implement adapters in `src/infrastructure/ai` that talk to specific providers.
- Keep prompt templates and transformations in dedicated classes or services (e.g., `PromptBuilder`).
- Validate all AI outputs before using them (e.g., strict JSON validation, schema checks).
- Wrap AI calls with retry and timeout logic to avoid blocking use cases.

