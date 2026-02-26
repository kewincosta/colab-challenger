# 📘 Clean Code & Software Design Principles Reference

This document gathers the most important software engineering principles
commonly applied in modern architectures such as Clean Architecture,
DDD, NestJS, React, and other scalable systems.

It can be used as:

-   📚 Study material
-   🔎 Code review checklist
-   🏗 Architecture guideline
-   🧠 Interview preparation reference
-   📖 Internal engineering documentation

------------------------------------------------------------------------

# 🧠 1. Fundamental Principles

## ✅ DRY --- Don't Repeat Yourself

**Definition:**\
Avoid duplicating logic across the system.

**Problems it solves:** - Rule inconsistencies - Hard maintenance -
Cascade bugs

⚠️ Over-abstraction can be worse than controlled duplication.

------------------------------------------------------------------------

## ✅ KISS --- Keep It Simple, Stupid

Prefer simple and clear solutions.

Avoid unnecessary complexity and premature pattern usage.

------------------------------------------------------------------------

## ✅ YAGNI --- You Aren't Gonna Need It

Do not implement features based on hypothetical future needs.

Build only what is required now.

------------------------------------------------------------------------

# 🔄 2. Control Flow & Readability

## ✅ Return Early (Early Exit Pattern)

Return as soon as possible to avoid nested conditionals.

Bad:

``` ts
if (user) {
  if (user.active) {
    process();
  }
}
```

Better:

``` ts
if (!user) return;
if (!user.active) return;
process();
```

Benefits: - Reduced nesting - Increased clarity - Easier maintenance

------------------------------------------------------------------------

## ✅ Guard Clauses

Explicit early returns to protect business logic invariants.

------------------------------------------------------------------------

## ✅ Fail Fast

If something is invalid, fail immediately.

Do not allow inconsistent states to propagate.

------------------------------------------------------------------------

# 🧱 3. SOLID Principles

## S --- Single Responsibility Principle

A class should have only one reason to change.

## O --- Open/Closed Principle

Open for extension, closed for modification.

## L --- Liskov Substitution Principle

Subtypes must be substitutable for their base types.

## I --- Interface Segregation Principle

Prefer small, specific interfaces.

## D --- Dependency Inversion Principle

Depend on abstractions, not concrete implementations.

------------------------------------------------------------------------

# 🧭 4. Architecture & Organization

## ✅ Separation of Concerns

Each layer should have a clear responsibility.

Controller → HTTP\
Service → Business Logic\
Repository → Persistence

## ✅ High Cohesion

Related code should live together.

## ✅ Low Coupling

Modules should minimize dependencies between each other.

## ✅ Law of Demeter

"Talk only to your immediate friends."

Avoid deep chaining like:

``` ts
order.customer.address.city.zipCode
```

------------------------------------------------------------------------

# 📦 5. Code Best Practices

## ✅ Immutability

Prefer immutable data when possible.

## ✅ Pure Functions

Functions should avoid side effects and be predictable.

## ✅ Composition Over Inheritance

Favor composition instead of deep inheritance hierarchies.

## ✅ Explicit is Better Than Implicit

Avoid hidden behavior or magic.

## ✅ Meaningful Naming

Names must express intention clearly.

------------------------------------------------------------------------

# 🧪 6. Testability

## ✅ Testability First

If code is hard to test, it is likely poorly structured.

## ✅ Side Effects Isolation

Isolate IO, DB calls, HTTP calls from business logic.

------------------------------------------------------------------------

# 🧠 7. Advanced Concepts

## Tell, Don't Ask

Delegate behavior to objects rather than asking for state.

## Anemic Domain Model (Anti-pattern)

Entities should contain business behavior, not just getters/setters.

## Bounded Context (DDD)

Clearly define domain boundaries.

## Idempotency

Repeated operations should not produce duplicated effects.

------------------------------------------------------------------------

# 🎯 Top 10 Most Commonly Asked Concepts

1.  DRY\
2.  SOLID\
3.  Clean Architecture\
4.  Separation of Concerns\
5.  Return Early\
6.  Repository Pattern\
7.  Dependency Injection\
8.  Fail Fast\
9.  High Cohesion / Low Coupling\
10. Meaningful Naming

------------------------------------------------------------------------

# 📌 How to Use This Document

-   As a pull request checklist
-   As an onboarding reference
-   As a feature design guideline
-   As an architecture validation tool

------------------------------------------------------------------------

**Author:** Engineering Team\
**Version:** 1.0\
**Year:** 2026
