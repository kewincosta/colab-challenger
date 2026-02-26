# AI-First Context

This backend is designed to support AI-powered urban triage as a first-class concern in future iterations.

## AI in the Application Layer

- AI triage logic belongs in the **application layer**, where use cases orchestrate:
  - Fetching reports.
  - Sending them to a `TriageService`.
  - Persisting triage results and updating domain entities.
- Example future use case: `TriagetReportUseCase` that takes a report ID, loads the report, calls the AI service, validates the response, and persists structured triage data.

## Avoiding LLM Provider Coupling

- Define a `TriageService` interface in the domain/application layer that expresses what the system needs (e.g., `triageReport(report: Report): Promise<TriageResult>`).
- Implement provider-specific adapters in `src/infrastructure/ai` (e.g., `OpenAiTriageAdapter`, `AzureOpenAiTriageAdapter`).
- Keep provider-specific configuration (API keys, endpoints, models) in configuration files and environment variables, not in domain code.

## Suggested Future Design

- **TriageService interface** (application/domain):
  - Describes capabilities independent of any provider.
- **LLM Adapter** (infrastructure):
  - Implements `TriageService`.
  - Handles HTTP calls, authentication, retries, and error translation.
- **Prompt Builder layer**:
  - Responsible for turning domain objects (e.g., `Report`) into prompts and tools calls.
  - Lives in `src/infrastructure/ai/prompting` or a similar folder.

## Validating LLM JSON Output Safely

- Always treat AI responses as untrusted data.
- Use strict schemas (e.g., Zod, class-validator, or JSON Schema) to validate AI responses before using them.
- Reject or retry on:
  - Missing required fields.
  - Type mismatches.
  - Out-of-range values.

## Risk Mitigation Strategies

- **Hallucinations**:
  - Constrain prompts to only use provided data.
  - Validate outputs and ignore unsupported fields.
- **Malformed JSON**:
  - Ask the model explicitly to return JSON only.
  - Implement parsing with fallbacks (e.g., regex extraction, repair strategies) and retry logic.
- **Retries and Timeouts**:
  - Introduce bounded retries with exponential backoff on transient errors.
  - Enforce timeouts for AI calls to prevent blocking the application.
- **Observability**:
  - Log AI requests/responses (with redaction) and track error rates to tune prompts and providers.
