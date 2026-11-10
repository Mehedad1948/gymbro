# Architecture decision records

Short, one per hard-to-reverse choice. Format: Context → Decision → Consequences.

## ADR-001 Local-first with IndexedDB (Dexie)
Context: single user, phone, must work offline in a gym basement; no backend budget yet.
Decision: all data in IndexedDB via Dexie repositories; no server state. Backup = JSON export.
Consequences: zero hosting cost, instant UI; sync must be added later through the repo seam (`docs/roadmap.md`). Browser storage can be evicted; the UI nags to export.

## ADR-002 Plan as a validated JSON document
Context: plans come from a coach (PDF), an AI, or the athlete; must be editable by hand and by machines.
Decision: one zod schema (`src/domain/plan/schema.ts`) is the contract; bundled plans are tested; import validates.
Consequences: AI agents can generate plans without touching code; schema evolution requires discipline (optional fields, version bump for breaking changes).

## ADR-003 Exercise dataset slimmed at build time, media remote
Context: `hasaneyldrm/exercises-dataset` is 16.6 MB JSON + ~125 MB GIFs; the app must stay small.
Decision: build script emits an English-only 856 KB catalog into `public/data`; GIFs/JPGs are fetched from the dataset host and cached on demand by the service worker.
Consequences: first view of a movement needs network; `NEXT_PUBLIC_EXERCISE_MEDIA_BASE` allows self-hosting; media licence (Gym visual) requires attribution and limits commercial use.

## ADR-004 Hand-written service worker, no PWA plugin
Context: Next 16 with Turbopack; webpack-based PWA plugins do not apply; needs are simple.
Decision: `public/sw.js` with explicit strategies; registered in production only.
Consequences: no build integration (precache list is manual); bump `VERSION` on cache-breaking changes; revisit if offline requirements grow.

## ADR-005 No UI kit, Tailwind tokens only
Context: small surface, mobile-only, dark-first.
Decision: a handful of primitives in `src/shared/ui`; tokens in `globals.css`.
Consequences: fast and tiny; if the surface grows (editor, charts), consider shadcn components added one at a time.
