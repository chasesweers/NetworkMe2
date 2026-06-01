# ADR-003: Tailwind CSS for Styling

## Status: Accepted

## Context
The original app used a single `globals.css` (~1000+ lines) with custom CSS variables for theming. This was hard to maintain and meant styles were disconnected from the components they affected.

## Decision
Use Tailwind CSS v4 with utility classes co-located in JSX. Dark mode via `class` strategy (`dark:` prefix). Component-level customization via `@apply` in `globals.css` only when utilities are insufficient (e.g. complex animations).

## Consequences
- Styles are co-located with markup — easier to scan and refactor
- Dark mode handled declaratively via Tailwind `dark:` utilities
- No separate stylesheet files per component
- Larger initial HTML (offset by PurgeCSS in production)
