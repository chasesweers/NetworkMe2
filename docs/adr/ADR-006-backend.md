# ADR-006: Backend Deferred — IndexedDB First

## Status: Accepted

## Context
The original app called a separate Express backend for auth, data sync, and AI bio generation. Running two servers locally added friction. The correct backend architecture (Next.js API routes vs separate service, database choice) is not yet decided.

## Decision
Start with IndexedDB for all persistence. Keep `NEXT_PUBLIC_API_BASE` as an optional env var — if set, stores will attempt to sync to the backend after every mutation, same pattern as the original app. Auth is optional: users can use the app as a guest.

Revisit this ADR when any of these become true:
- Multi-device sync is required
- AI bio feature is prioritized
- User accounts become a product requirement

## Consequences
- Zero backend dependency to get started
- IndexedDB works offline
- Auth and sync features are stubbed but not wired until ADR is revisited
