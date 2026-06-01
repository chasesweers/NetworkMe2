# ADR-004: Vitest + React Testing Library + Playwright

## Status: Accepted

## Context
The original app had minimal test coverage — a few unit tests for utility functions and one integration test for AuthModal. E2E tests existed but were incomplete.

## Decision
- **Unit tests**: Vitest with jsdom — for pure functions (`lib/`) and Zustand store actions
- **Integration tests**: React Testing Library — for component behavior (render, interact, assert DOM)
- **E2E tests**: Playwright — for full user flows in a real browser

All three layers are configured from project bootstrap so there's no friction adding tests.

## Consequences
- Vitest is fast and shares Vite config — no separate Jest config
- RTL tests are co-located with component concerns
- Playwright E2E are written after a feature is stable (not before), as documented in `.feature` files
