# Gymbro — agent handbook

Local-first PWA (Next.js 16, App Router, Tailwind v4, Dexie/IndexedDB, zod) for storing training plans, logging set weights, and viewing movement guides. One user, one phone, no backend yet.

## Start here (read in this order, ~5 min)
1. `docs/README.md` — map of all docs.
2. `docs/architecture.md` — layers, folder rules, data flow, decisions.
3. `docs/plan-schema.md` — the plan JSON contract (source of truth: `src/domain/plan/schema.ts`).
4. `docs/roadmap.md` — what is done, what is next, with acceptance criteria per task.

## Commands
```bash
npm run dev            # http://localhost:3000
npm run check          # typecheck + lint + unit tests (run before finishing any task)
npm run build          # must stay green; all routes prerender (static / partial)
npm run catalog:build  # rebuild public/data/exercises.json from the dataset
npm run icons:build    # regenerate PWA icons
```

## Hard rules
- Read `node_modules/next/dist/docs/` before using a Next.js API you are not sure about; this Next version differs from training data (Cache Components on, `useParams`/`usePathname` must sit under `<Suspense>`).
- Dependency flow is one-way: `app → features → infra/domain/shared`, `infra → domain/shared`, `domain → nothing`. `domain/` is pure TS with unit tests; never import React, Dexie or Next there.
- All user data lives in IndexedDB through `src/infra/db/*-repo.ts`. UI components never touch `db()` for writes; reads go through `useLiveQuery` hooks in `features/`.
- Plan JSON must validate with `parsePlan()`. Bundled plans live in `src/content/plans/` and are covered by `src/content/__tests__` (schema + catalog id existence). Extend the schema only with optional fields and a note in `docs/plan-schema.md`; bump `PLAN_SCHEMA_VERSION` for breaking changes.
- Changing Dexie indexes requires a new `this.version(n)` in `src/infra/db/database.ts`; never edit a shipped version.
- Exercise media is remote and © Gym visual; keep the attribution line wherever it is shown.
- Keep it dependency-light. Ask before adding a UI kit, state library, or backend SDK.
- Run `npm run check` and `npm run build` before declaring a task done; report failures verbatim.

## Where things are
| Concern | Path |
|---|---|
| Routes (thin) | `src/app/**/page.tsx` |
| Feature UI + hooks | `src/features/<feature>/` |
| Pure domain (schema, set expansion, progression) | `src/domain/` |
| Storage, catalog, PWA | `src/infra/` |
| UI primitives, helpers | `src/shared/` |
| Bundled plans | `src/content/plans/*.json` |
| Service worker | `public/sw.js` (bump `VERSION` on cache-breaking changes) |
| Exercise catalog (generated) | `public/data/exercises.json` |
| AI plan generation | `docs/ai/plan-generation-guide.md` + `docs/ai/athlete-context.md` |
