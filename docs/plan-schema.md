# Plan JSON schema (v1)

Source of truth: `src/domain/plan/schema.ts` (zod). Validate with `parsePlan()` or by importing in the app. Full examples: `src/content/plans/*.json`.

## Shape
```jsonc
{
  "schemaVersion": 1,
  "id": "plan-5-xyz-2027-01",            // slug: a-z 0-9 dashes; unique; never reuse
  "name": "Plan 5 · …",
  "nameFa": "…",                           // optional localized name
  "meta": {
    "author": "Coach name | Claude (AI) | self",
    "source": "coach" | "ai" | "self",
    "createdAt": "YYYY-MM-DD",
    "startDate": "YYYY-MM-DD",             // drives "Week N" on the Today screen
    "durationWeeks": 9, "daysPerWeek": 4,
    "split": "Upper A / Lower A / Upper B / Lower B",
    "goal": "one sentence",
    "rationale": ["why, tied to scan numbers and history"],
    "tags": ["hypertrophy"], "provenance": "where it came from"
  },
  "guidelines": ["rules shown before every session"],
  "weeklyTemplate": ["upper-a", "lower-a", "rest", "upper-b", "lower-b", "rest", "rest"],
  "weeks": [ { "week": 1, "label": "Intro", "instruction": "RIR 3", "rir": 3,
               "setMultiplier": 0.6, "loadMultiplier": 0.9 } ],   // multipliers optional (deloads)
  "sessions": [ Session, … ]
}
```

### Session
```jsonc
{
  "id": "upper-a", "name": "Upper A", "nameFa": "…",
  "kind": "training" | "corrective" | "conditioning" | "menu",   // default training
  "focus": ["chest", "back"], "durationMin": 70,
  "warmup": ["5 min incline walk", "Corrective warm-up"],
  "blocks": [ Block, … ],
  "cooldown": ["15 min incline walk"], "notes": ["…"]
}
```
- `corrective`: shown collapsed inside every training workout as the warm-up block.
- `menu`: a pick-list (e.g. core menu); has no Start button.

### Block
```jsonc
{ "type": "straight" | "superset" | "compound" | "circuit",   // default straight
  "rounds": 3, "restSec": 75, "note": "…", "exercises": [ Exercise, … ] }
```
For `straight`, put exactly one exercise per block. `rounds`/`restSec` on the block apply to grouped types.

### Exercise
```jsonc
{
  "key": "bench-press",            // slug, unique within the session
  "name": "Barbell bench press", "nameFa": "پرس سینه هالتر",
  "exerciseId": "0025",            // 4-digit catalog id → movement guide + cross-plan history. Omit for custom drills.
  "alternatives": ["0757"],        // catalog ids to swap when the station is busy
  "equipment": "barbell",
  "sets": 4,
  "reps": 8 | [6, 8] | [12, 10, 8, 8],   // fixed | ascending range | per-set ladder
  "seconds": 30,                   // instead of reps for timed work (either reps or seconds required)
  "perSide": true,
  "rir": 2 | [1, 2],
  "tempo": "3-1-1",
  "restSec": 150,
  "progression": { "type": "double", "incrementKg": 2.5 } | { "type": "reps", "incrementReps": 1 } | { "type": "none" },
  "startLoadKg": 60,
  "cue": "one-line technique cue"
}
```
Defaults: no `progression` ⇒ double progression with 2.5 kg. Rep range convention: an ascending 2-item array is a range, anything else is a ladder.

## Validation rules enforced
- Unique session ids; unique exercise keys per session; `weeklyTemplate` ids must exist (or be `"rest"`).
- Catalog ids must match `^\d{4}$`; the test suite additionally checks they exist in `public/data/exercises.json` for bundled plans.

## Finding catalog ids
```bash
node -e 'const c=require("./public/data/exercises.json").exercises;const re=new RegExp(process.argv[1],"i");c.filter(e=>re.test(e.name)).slice(0,15).forEach(e=>console.log(e.id,e.name,"|",e.equipment,"|",e.target))' "lat pulldown"
```
Common ids are listed in `docs/ai/plan-generation-guide.md`.

## Evolving the schema
- Add optional fields freely; document them here and in the guide.
- Breaking changes: bump `PLAN_SCHEMA_VERSION`, add a migration in `parsePlan` (accept old versions, upgrade in place), keep bundled plans valid.
