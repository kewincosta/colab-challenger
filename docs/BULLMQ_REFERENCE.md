# Reference Prompt -- Asynchronous Processing with NestJS and BullMQ

## Objective

Design and implement an asynchronous processing architecture using
NestJS and BullMQ (Redis-based queue) to decouple HTTP request/response
time from long-running background tasks (e.g., AI processing, external
API calls, heavy computations).

⚠️ Important: All naming conventions (queue names, job names, status
enums, entities, modules, etc.) used in this document are illustrative
examples only. They **must be adapted** to match the specific domain
language and bounded contexts of your project.

------------------------------------------------------------------------

## High-Level Architecture (Conceptual)

Expected Flow:

1.  HTTP endpoint receives a request.
2.  The API validates input and persists a record in the database with
    an initial status (e.g., `PENDING`, `QUEUED`, etc.).
3.  The API publishes a job to a queue, passing a minimal payload (e.g.,
    a record ID).
4.  The API immediately returns a success response (e.g., HTTP 201 or
    202).
5.  A Worker consumes the job asynchronously:
    -   Updates status to `PROCESSING`
    -   Executes business logic (e.g., calls AI service)
    -   Persists results
    -   Updates status to `DONE` or `FAILED`
6.  Optional: Queue events are used for logging, monitoring, or metrics.

This ensures responsiveness, scalability, and fault tolerance.

------------------------------------------------------------------------

## Key Design Principles

### 1. Minimal Job Payload

Jobs should carry only identifiers (e.g., `entityId`), not the entire
domain object.

Rationale: - Database remains the source of truth. - Reduces Redis
memory usage. - Improves retry and idempotency strategies.

------------------------------------------------------------------------

### 2. Idempotency

Workers must be idempotent.

Examples: - Before processing, verify if the entity is already in a
terminal state (`DONE`). - Use compare-and-set updates (e.g., only
transition `PENDING -> PROCESSING` if still `PENDING`). - Ensure
repeated execution does not corrupt state.

Queues typically provide *at-least-once delivery*, so duplicate
execution must be handled safely.

------------------------------------------------------------------------

### 3. Deduplication Strategy

BullMQ provides deduplication mechanisms:

-   **Simple Mode**: Ignore duplicate jobs until the first completes.
-   **Throttle Mode**: Ignore duplicates within a TTL window.
-   **Debounce Mode**: Replace previous job with the latest one.

Use cases (examples only): - One job per entity ID → Simple Mode. -
Prevent rapid duplicate submissions → Throttle Mode. - Always process
only the latest update → Debounce Mode.

Adapt the strategy to your domain requirements.

Reference: https://docs.bullmq.io/guide/jobs/deduplication

------------------------------------------------------------------------

### 4. FIFO Behavior

BullMQ queues are FIFO by default.

However: - With concurrency \> 1 or multiple workers, - Jobs may finish
out of order.

If strict ordering per entity is required, additional partitioning
strategies may be necessary.

Reference: https://docs.bullmq.io/guide/jobs/fifo

------------------------------------------------------------------------

### 5. Concurrency Tuning

Workers support configurable concurrency.

Use higher concurrency for: - I/O-bound tasks (HTTP calls, database
operations).

Be cautious of: - External API rate limits. - Database connection pool
exhaustion. - Memory/CPU constraints.

Start conservatively and scale based on metrics.

Reference: https://docs.bullmq.io/guide/workers/concurrency

------------------------------------------------------------------------

### 6. Retry and Backoff Policies

Define: - `attempts` - `backoff` strategy (e.g., exponential)

This increases resilience against transient failures (timeouts, network
issues, etc.).

------------------------------------------------------------------------

### 7. Queue Events and Observability

Use queue or worker event listeners to:

-   Log lifecycle events (`active`, `completed`, `failed`).
-   Capture deduplication events.
-   Emit metrics (e.g., Prometheus, OpenTelemetry).
-   Track job duration.

References: https://docs.bullmq.io/guide/nestjs/queue-events-listeners
https://docs.nestjs.com/techniques/queues#queues

------------------------------------------------------------------------

## Suggested Status Lifecycle (Example Only)

Adjust to your domain terminology.

Possible states:

-   `PENDING`
-   `PROCESSING`
-   `DONE`
-   `FAILED`
-   `RETRYING` (optional)
-   `DEAD_LETTER` (optional)

Store additional metadata: - `attemptsMade` - `lastError` -
`processedAt` - `completedAt`

------------------------------------------------------------------------

## Recommended Structural Separation

-   HTTP Layer (Controller)
-   Application Layer (Service / Use Case)
-   Queue Producer
-   Worker / Processor
-   Persistence Layer (Repository / ORM)
-   Observability Layer (Events, Logging, Metrics)

The queue infrastructure must not leak domain logic. The worker should
orchestrate use cases from the domain layer, not embed business rules
directly in infrastructure code.

------------------------------------------------------------------------

## NestJS Integration References

Producer Documentation: https://docs.bullmq.io/guide/nestjs/producers

Queue Events: https://docs.bullmq.io/guide/nestjs/queue-events-listeners

NestJS Official Queue Guide:
https://docs.nestjs.com/techniques/queues#queues

------------------------------------------------------------------------

## Implementation Checklist

-   [ ] Redis connection configured.
-   [ ] Queue registered in module.
-   [ ] Producer publishes minimal job payload.
-   [ ] Worker implemented with idempotent logic.
-   [ ] Concurrency tuned appropriately.
-   [ ] Retry/backoff strategy defined.
-   [ ] Deduplication strategy selected (if needed).
-   [ ] Status lifecycle persisted in database.
-   [ ] Events wired for monitoring/logging.
-   [ ] Metrics and alerting configured.

------------------------------------------------------------------------

## Final Note

This document serves as a generic architectural reference.

All naming conventions, queue names, job identifiers, entity labels, and
status enums are examples and must be aligned with:

-   Your project's ubiquitous language.
-   Your bounded contexts.
-   Your business rules.
-   Your infrastructure constraints.

Adapt deliberately and consistently.
