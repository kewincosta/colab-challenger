# Future Improvements — Post-POC

Items intentionally excluded from the BullMQ POC scope to keep delivery lean.
Each item includes context on **why** it matters and **when** to prioritize it.

---

## 1. Queue Event Listeners (Observability)

**What:** Wire BullMQ lifecycle events (`active`, `completed`, `failed`, `stalled`) to structured logging and/or external sinks.

**Why it matters:**
- Visibility into job throughput, failure rates, and stall detection.
- Enables alerting on anomalous patterns (e.g., sudden spike in failures).

**When to add:** Before going to production or when debugging queue issues becomes painful.

**Reference:** https://docs.bullmq.io/guide/nestjs/queue-events-listeners

---

## 2. Metrics & Alerting (Prometheus / OpenTelemetry)

**What:** Expose queue metrics (job duration, wait time, failure rate, retry count) via Prometheus or OpenTelemetry.

**Why it matters:**
- Quantitative insight into system health and AI processing latency.
- Enables dashboards (Grafana) and automated alerts (PagerDuty, Slack).

**When to add:** When the system serves real users and SLA monitoring is required.

---

## 3. Dead Letter Queue (DLQ)

**What:** After exhausting all retry attempts, move failed jobs to a dedicated dead letter queue instead of only marking them as `FAILED`.

**Why it matters:**
- Enables manual inspection, replay, or automated recovery of permanently failed jobs.
- Prevents data loss — failed jobs can be reprocessed after fixing the root cause.

**When to add:** When failure recovery needs to be systematic rather than ad-hoc.

**Reference:** https://docs.bullmq.io/guide/retrying-failing-jobs

---

## 4. Job Duration Tracking

**What:** Measure and persist `startedAt`, `completedAt`, and `durationMs` per job execution.

**Why it matters:**
- Identifies performance regressions in AI classification.
- Feeds into capacity planning (how many workers are needed for X throughput).

**When to add:** Alongside metrics (item 2) or when optimizing worker concurrency.

---

## 5. Rate Limiting (Gemini API)

**What:** Configure BullMQ's built-in rate limiter to cap jobs per time window, aligned with Gemini API quotas.

**Why it matters:**
- Prevents 429 errors from Gemini under high load.
- More predictable than relying solely on concurrency limits.

**When to add:** When report volume is high enough to risk hitting Gemini rate limits.

**Reference:** https://docs.bullmq.io/guide/rate-limiting

---

## 6. Graceful Shutdown

**What:** Ensure workers drain in-progress jobs before the process exits (e.g., on deploy or scaling events).

**Why it matters:**
- Prevents jobs from being left in a `PROCESSING` state with no worker to complete them.
- Avoids data inconsistency.

**When to add:** Before deploying to any environment with rolling updates or auto-scaling.

**Reference:** https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers

---

## 7. Real-Time Status Updates (SSE / WebSocket)

**What:** Push classification status updates to the client in real-time instead of requiring polling via `GET /reports/:id`.

**Why it matters:**
- Better UX — the user sees the classification result appear without refreshing.
- Reduces unnecessary polling traffic.

**When to add:** When a frontend exists and user experience is a priority.

---

## 8. Job Progress Reporting

**What:** Use BullMQ's `job.updateProgress()` to report intermediate steps (e.g., "calling AI", "validating response", "persisting result").

**Why it matters:**
- Enables richer UI feedback during long-running classifications.
- Useful for debugging where in the pipeline a job stalls.

**When to add:** Together with real-time status updates (item 7).

---

## Priority Guide

| Priority | Items | Trigger |
|----------|-------|---------|
| **P1 — Pre-production** | Graceful shutdown, Queue event listeners | Before first deploy |
| **P2 — Early production** | DLQ, Rate limiting | When real traffic starts |
| **P3 — Maturity** | Metrics, Job duration, Real-time updates, Progress reporting | When scaling or UX demands it |
