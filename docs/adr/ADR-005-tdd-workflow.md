# ADR-005: TDD Workflow — Gherkin Spec → Unit Tests → Implementation

## Status: Accepted

## Context
Without a structured approach, tests are written as an afterthought or not at all. The rewrite should establish a discipline that makes testing the default, not an add-on.

## Decision
Every feature follows three mandatory steps before code ships:

**Step 1 — Gherkin spec** (`tests/specs/<feature>.feature`)
Plain-English behavior description. Must exist before any code is written. Includes an `## Integration Coverage` and `## E2E Coverage` section documenting what will be tested at each layer.

**Step 2 — Failing unit tests** (Red)
Write tests for store actions, pure functions, and component behavior. Run `npm test` — they must fail. No implementation yet.

**Step 3 — Implement** (Green → Refactor)
Write the minimum code to pass the tests, then refactor. Integration and E2E tests are written once the feature is stable.

## Consequences
- Forces clarity about behavior before touching implementation
- Gherkin specs serve as living documentation
- Catches regressions early with fast unit tests
- E2E tests focus on critical paths, not exhaustive coverage
