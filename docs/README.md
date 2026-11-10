# Docs index

| Doc | Purpose | Update when |
|---|---|---|
| [architecture.md](architecture.md) | Layers, folder rules, data model, storage, PWA strategy, decisions | Any structural change |
| [plan-schema.md](plan-schema.md) | Human-readable plan JSON contract with examples | `src/domain/plan/schema.ts` changes |
| [roadmap.md](roadmap.md) | Done / next / later, each task with acceptance criteria | After finishing or re-scoping a task |
| [ai/plan-generation-guide.md](ai/plan-generation-guide.md) | Prompt + rules an AI agent follows to generate a new plan JSON | Coaching rules or schema change |
| [ai/athlete-context.md](ai/athlete-context.md) | Athlete profile, gym equipment, body-scan history, training history | After each body scan or finished block |
| [decisions/](decisions/) | Short ADRs for choices that are hard to reverse | New hard-to-reverse choice |
| [plans/](plans/) | Original coach PDFs (source material; digitized into `src/content/plans/`) | New coach PDF arrives |
| [analysis/](analysis/) | Body-composition scan images | New scan |

## Generating the next plan (the primary workflow)
1. Update `ai/athlete-context.md` (new scan numbers, how the last block went, any pain / constraints).
2. Export workout history from the app (Settings → Export all data) and attach it, or summarize top sets per exercise.
3. Give an AI agent: `ai/plan-generation-guide.md`, `ai/athlete-context.md`, `plan-schema.md`, and the export.
4. Save the returned JSON to `src/content/plans/<id>.json`, add it to `src/content/plans/index.ts` (first entry = default), run `npm run test`.
5. Or import it directly on the phone: Plans → Import (validation happens there too).
