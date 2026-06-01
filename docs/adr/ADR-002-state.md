# ADR-002: Redux Toolkit for State Management

## Status: Accepted (supersedes Zustand decision)

## Context
Initial implementation used Zustand. After review, Redux Toolkit was chosen to align with team familiarity, provide stronger DevTools support, and offer a more explicit action/reducer model that pairs well with the TDD workflow — each slice action is a named, dispatchable unit that is easy to test in isolation.

## Decision
Use Redux Toolkit (`@reduxjs/toolkit` + `react-redux`) with domain-scoped slices:
- `connectionSlice` — connections, favorites, search/filter state
- `relationshipSlice` — relationships and custom types
- `noteSlice` — per-connection notes cache
- `authSlice` — authentication user, token, login/signup
- `uiSlice` — theme, onboarding flag

A single `configureStore` in `stores/index.ts` combines all slices. A `StoreProvider` client component handles localStorage hydration on mount and subscribes to persist state on changes (no extra library required).

Components use `useSelector` / `useDispatch` from `react-redux`.

## Consequences
- Actions are named and serializable — great for debugging and testing
- Redux DevTools work out of the box
- More boilerplate than Zustand (separate slice + selector + dispatch), offset by the `createSlice` API
- SSR-safe: initial state is plain JS; localStorage hydration happens in a client component
- Tests use the real Redux store directly: `store.dispatch(action())` + `store.getState()`
