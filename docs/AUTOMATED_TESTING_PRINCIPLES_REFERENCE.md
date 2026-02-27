# 📘 Automated Testing Principles Reference Document

This document consolidates the principles that should guide the creation
and maintenance of automated tests in modern projects (modular
monoliths, microservices, serverless, or traditional applications).

------------------------------------------------------------------------

# 1️⃣ F.I.R.S.T

Tests must follow the classic **F.I.R.S.T** rule:

-   **F --- Fast**\
-   **I --- Independent**\
-   **R --- Repeatable**\
-   **S --- Self-validating** (automatically pass or fail)\
-   **T --- Timely** (written at the right time, ideally alongside or
    before the code)

------------------------------------------------------------------------

# 2️⃣ Core Principles

## 🔹 Tests must be deterministic

**Definition:**\
The same input must always produce the same output.

### ❌ Not allowed:

-   Real external API dependency
-   Uncontrolled use of `Date.now()`
-   Environment-dependent timezone behavior
-   Uncontrolled random data

### ✅ Best practices:

-   Mock external dependencies
-   Inject a clock provider
-   Use fixed seeds for randomness
-   Explicit context control

------------------------------------------------------------------------

## 🔹 Tests must be independent

**Definition:**\
A test must not depend on the execution of another test.

### Rules:

-   Execution order must not matter
-   Each test prepares its own scenario
-   No shared mutable state

------------------------------------------------------------------------

## 🔹 Tests must be fast

Slow tests are ignored.

  Type          Expected Duration
  ------------- -------------------
  Unit          Milliseconds
  Integration   Seconds
  E2E           Minutes (few)

------------------------------------------------------------------------

## 🔹 Tests must be isolated

A unit test should validate only **one unit of behavior**.

### Use:

-   Mock
-   Stub
-   Fake
-   Spy

------------------------------------------------------------------------

## 🔹 Tests must be clear and readable

A test is executable documentation.

### Mandatory structure:

Arrange\
Act\
Assert

-   **Arrange** → Prepare scenario\
-   **Act** → Execute action\
-   **Assert** → Validate result

------------------------------------------------------------------------

## 🔹 Tests must fail for a single reason

> One test → One behavior → One reason to fail

------------------------------------------------------------------------

## 🔹 Tests must validate behavior, not implementation

### ❌ Do not test:

-   Private methods
-   Internal class structure
-   Framework behavior

### ✅ Test:

-   Public contract
-   Business rules
-   Observable outcomes

------------------------------------------------------------------------

# 3️⃣ Test Pyramid

        E2E
     Integration

Unit

-   **Unit:** highest volume, fastest\
-   **Integration:** module interaction\
-   **E2E:** full system flow

Avoid the inverted pyramid (too many E2E tests).

------------------------------------------------------------------------

# 4️⃣ Tests must cover business logic, not the framework

## ❌ Do not test:

-   Express
-   NestJS
-   Spring

Frameworks already have their own test suites.

## ✅ Test:

-   Your business logic
-   Your domain rules

------------------------------------------------------------------------

# 5️⃣ Tests are part of the architecture

Tests are not an afterthought --- they are a consequence of good design.

## A well-designed system has:

-   Inverted dependencies
-   Use of interfaces
-   Isolated domain layer
-   Low coupling
-   High cohesion

## This enables:

-   Fast tests
-   Isolated tests
-   No need for real database
-   No need for external infrastructure

------------------------------------------------------------------------

# 📌 Final Rule

> If a test is hard to write, the code design likely needs improvement.
