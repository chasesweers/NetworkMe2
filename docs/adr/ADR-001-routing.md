# ADR-001: Use Next.js App Router with File-Based Routing

## Status: Accepted

## Context
The original NetworkMe app used a single-page tab-based SPA pattern — all navigation was controlled by a `activeTab` state variable with no URL changes. This meant no deep-linking, no browser history, and no meaningful back-button behavior.

## Decision
Use Next.js 15 app router with real file-based routes:
- `/` — redirects to `/welcome` (first visit) or `/search` (returning)
- `/welcome` — onboarding wizard
- `/import` — CSV upload
- `/search` — connection list
- `/graph` — network visualization
- `/profile/[key]` — connection detail

## Consequences
- Deep-linkable URLs for every view
- Browser history works naturally
- Profile pages are proper routes, not overlays
- Slightly more setup than a single-page approach, but dramatically better UX and testability
