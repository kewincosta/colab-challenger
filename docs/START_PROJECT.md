You are tasked with designing and scaffolding the backend for a Proof of Concept:

“Smart Municipal Service – AI-Powered Urban Triage”

Context:
The platform receives citizen reports about urban issues.
In the future, reports will be processed by an LLM for automated classification.
For now, focus ONLY on structuring a clean, scalable, production-ready backend foundation.

This is NOT just about writing code.
You must build:
1) A clean NestJS modular project
2) A formal Architecture Document
3) A reusable Backend Engineering Guidelines document
4) A foundation ready for AI-first expansion
5) Dockerized infrastructure
6) Swagger documentation
7) Tests (unit + integration)
8) TypeORM with PostgreSQL
9) DDD + Clean Architecture
10) SOLID principles applied properly

========================================================
PRIMARY GOAL
========================================================

Build a scalable backend foundation that can:
- Receive a citizen report (POST /reports)
- Persist it in PostgreSQL
- Be easily extended to integrate AI triage in the next iteration

DO NOT integrate AI yet.
Focus on architecture.

========================================================
MANDATORY TECH STACK
========================================================

- Node.js
- NestJS (latest stable)
- TypeScript (strict mode)
- TypeORM
- PostgreSQL
- class-validator + class-transformer
- Swagger
- Jest
- Docker + Docker Compose

========================================================
ARCHITECTURAL REQUIREMENTS
========================================================

Follow official and community-recognized references:

NestJS Docs (modules, DI, pipes, controllers):
https://docs.nestjs.com/

Validation:
https://docs.nestjs.com/techniques/validation

Database + TypeORM:
https://docs.nestjs.com/techniques/database

Repository Pattern (best practices):
https://dev.to/adamthedeveloper/repository-pattern-in-nestjs-do-it-right-or-go-home-268f

Clean Architecture with NestJS:
https://medium.com/nestjs-ninja/mastering-nestjs-unleashing-the-power-of-clean-architecture-and-ddd-in-e-commerce-development-97850131fd87

========================================================
STRUCTURE REQUIREMENTS
========================================================

Organize project using Clean Architecture + DDD:

src/
  domain/
    reports/
      entities/
      value-objects/
      repositories/
      exceptions/
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
  shared/
    config/
    logger/
    constants/

Rules:
- Domain must NOT depend on NestJS
- Infrastructure must implement domain repository interfaces
- Controllers must be thin
- Use Cases orchestrate business logic
- Entities must NOT be anemic

========================================================
VALIDATION + GLOBAL PIPE
========================================================

- Enable global ValidationPipe with:
  whitelist: true
  transform: true
  forbidNonWhitelisted: true

========================================================
REST ENDPOINT
========================================================

POST /reports

Request body:
- title (string)
- description (string)
- location (string or object)

Return:
- id
- createdAt
- original data

Use proper HTTP status codes.

========================================================
SWAGGER DOCUMENTATION
========================================================

- Enable Swagger at /api/docs
- Decorate DTOs and controllers
- Add descriptions to fields
- Include example payload

========================================================
TESTING REQUIREMENTS
========================================================

Implement:
- Unit tests for:
  - CreateReportUseCase
  - Repository implementation
- Integration test for:
  - POST /reports

Use Jest + SuperTest.

========================================================
DOCKER REQUIREMENTS
========================================================

Provide:
- Dockerfile
- docker-compose.yml with:
  - app
  - postgres
- .env.example
- Instructions in README

========================================================
CRITICAL ADDITION — ARCHITECTURE DOCUMENT
========================================================

Generate a file:

/docs/ARCHITECTURE.md

This document must include:

1) Architectural style explanation
   - Why Clean Architecture?
   - Why DDD?
   - Why Repository pattern?
   - Why TypeORM?
   - Why modular NestJS?

2) Layer explanation:
   - Domain
   - Application
   - Infrastructure
   - Presentation

3) Dependency rule explanation

4) How this supports future AI integration

5) Trade-offs made

6) Scalability considerations

7) Testing strategy explanation

8) Database design decisions

9) How to extend the system safely

10) Security considerations (future guards, auth, rate limiting)

========================================================
CRITICAL ADDITION — BACKEND ENGINEERING GUIDELINES
========================================================

Generate a reusable file:

/docs/BACKEND_GUIDELINES.md

This must serve as:

A reusable playbook to guide:
- Future features
- New modules
- AI integration
- Code reviews

It must include:

1) Folder structure conventions
2) Naming conventions
3) How to create a new feature module
4) How to add new Use Cases
5) How to implement new repositories
6) How to write tests
7) Rules for not breaking Clean Architecture
8) SOLID principles applied in this project
9) DTO best practices
10) Validation standards
11) Error handling strategy
12) Logging standards
13) How to introduce AI integration later safely

This document should be written clearly so it can be reused as:
- Internal engineering handbook
- AI instruction prompt
- Onboarding documentation

========================================================
AI-FIRST CONTEXT DOCUMENT
========================================================

Generate a short file:

/docs/AI_FIRST_CONTEXT.md

Explain:
- How AI triage will fit into Application layer
- How to avoid coupling LLM provider to domain
- Suggested future design:
  - TriageService interface
  - LLM Adapter
  - Prompt Builder layer
- How to validate LLM JSON output safely
- Risk mitigation strategies (hallucination, malformed JSON, retries)

========================================================
README REQUIREMENTS
========================================================

README.md must include:

- Project overview
- Tech stack
- Architecture summary
- How to run locally (npm + docker)
- How to run tests
- How to access Swagger
- Folder explanation
- Why architectural decisions were made

========================================================
QUALITY REQUIREMENTS
========================================================

- Strict TypeScript
- No `any`
- Clean separation of concerns
- Idiomatic NestJS
- Proper dependency injection
- SOLID principles respected
- Entities not anemic
- Tests must pass
- No business logic inside controllers
- No direct TypeORM usage inside domain

========================================================

Return:

1) Folder tree
2) Core example code for:
   - Entity
   - Repository interface
   - TypeORM implementation
   - Use Case
   - Controller
   - DTO
3) Docker files
4) Test examples
5) Full ARCHITECTURE.md
6) BACKEND_GUIDELINES.md
7) AI_FIRST_CONTEXT.md
8) README.md

The result must look like a production-ready backend foundation for a scalable civic AI platform.