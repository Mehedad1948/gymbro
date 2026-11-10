# Roadmap

Each task is sized for a short agent session. Acceptance = `npm run check` and `npm run build` green plus the listed criteria. Update the status column when you finish.

## Done (v0.1 scaffold, 2026-11-10)
- Architecture, layers, docs, plan schema with tests.
- Dexie storage with plans / workouts / setLogs / settings; backup export + restore; wipe.
- Bundled plans: 3 historical coach plans digitized + Plan 4 (new AI block).
- Today, Plans (list/detail/import/export/archive), Workout runner (previous sets, suggestion, rest timer, corrective block), History, Exercise guide (search, GIF, steps, personal history), Settings.
- PWA: manifest, icons, hand-written service worker, catalog build script.

## Next (ordered)
| # | Task | Acceptance criteria | Status |
|---|---|---|---|
| 1 | Smoke test on a phone | Install to home screen on Android and iOS; start a session, log 3 sets, kill the app, reopen offline, data and GIF of a viewed exercise still present. Record findings in this table. | todo |
| 2 | Week-aware prescriptions | In the runner, apply the active week's `rir`, `setMultiplier`, `loadMultiplier` from `plan.weeks` (week derived from `meta.startDate`, overridable in Settings). Show "W5 deload: 2 of 4 sets" badge. Unit-test the week resolution in `domain/`. | todo |
| 3 | Progress view | `/history/exercise/[exerciseKey]`: table + simple SVG line of best set and e1RM per workout (`domain/progression/e1rm.ts`, Epley, tested). Link from the exercise guide and the runner header. | todo |
| 4 | Plan editor (minimal) | Edit exercise sets/reps/rest/rir and swap `exerciseId` from the catalog inside Plan detail; saves via `plansRepo.upsertImported` and marks `userEdited`. Keep schema validation on save. | todo |
| 5 | Import lint for ESLint boundaries | Add `eslint-plugin-boundaries` or `no-restricted-imports` rules matching `docs/architecture.md`; CI script `npm run check` fails on violations. | todo |
| 6 | Catalog i18n | `scripts/build-exercise-catalog.mjs` option to include a second language's steps (`fa` is not in the dataset; `en` only for now), UI language toggle stored in settings. | later |
| 7 | Body-scan log | Settings → "Body scans": date, weight, SMM, PBF, visceral fat; table + sparkline; included in the backup export and in a "Copy context for AI" button that renders `athlete-context.md` sections from data. | later |
| 8 | Plan generation helper | Settings → "Generate next plan": builds a prompt bundle (guide + context + best sets JSON) to copy into any AI chat; later, optional direct API call behind a user-supplied key. | later |

## Later: coach / multi-user mode (not started, keep the seams)
1. **Identity**: add `ownerId` to all records (Dexie v2 with `upgrade` filling the local user id). Auth adapter in `infra/auth/`.
2. **Sync**: `infra/sync/` with push/pull of changed rows (`updatedAt` watermarks, last-write-wins per row, tombstones for deletes). Backend options: Postgres via a thin Next route-handler API (Neon MCP is already configured in this workspace) or a hosted BaaS. Decide in an ADR.
3. **Coach upload**: coach creates a plan JSON (same schema) assigned to an athlete id; the athlete's app pulls it into `plans` with `origin: "coach"` and `meta.source: "coach"`; athlete logs sync back so the coach can read progress.
4. **Permissions**: coach can read athlete's `workouts`/`setLogs`, write `plans`; athlete owns everything else.

## Non-goals for now
Social features, nutrition tracking, wearables, native app stores.
