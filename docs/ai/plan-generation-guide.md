# Plan generation guide (for AI agents)

You are generating the next training block for one athlete. Your output is a single JSON document that validates against `docs/plan-schema.md` (source of truth: `src/domain/plan/schema.ts`). Follow this guide exactly; it records the rules used to build Plan 4 (`src/content/plans/plan-4-upper-lower-2026-11.json`), which is the canonical example of a correct output. A short Persian summary for the athlete lives in the app at `/plans/guide` (`src/features/plans/plan-guide.tsx`); update it when the rules here change.

## 1. Inputs
1. `docs/ai/athlete-context.md`: profile, equipment, scan table, training history, constraints, **days per week**. Required. If it is missing, stop and ask. Never invent scan numbers.
2. The previous plan JSON: keep what worked, change what did not.
3. Set-log export (optional, Settings → Export all data): best set per exercise per week. Use it for `startLoadKg` and to decide which lifts to keep.
4. `docs/plan-schema.md` for the field contract.

## 2. How the app uses your JSON (design constraints)
- **History links by catalog id.** Logs are stored under `exerciseId` (or `custom:<key>` when there is no id). Reusing the same `exerciseId` across plans keeps the athlete's history and load suggestions. For custom drills, keep the same `key` across plans.
- **Load suggestion** (`src/domain/progression/suggest.ts`): with `progression.type: "double"`, when every set at the last load reached the top of the rep range at or below the target RIR, the app suggests `+incrementKg`; otherwise it repeats the load. With `"reps"` it says "add N reps"; with `"none"` it shows nothing.
- **Week number** = full weeks since `meta.startDate` + 1, shown with the matching `weeks[]` entry on the Today screen.
- **`setMultiplier` / `loadMultiplier` are not applied by the app yet** (roadmap #2). Always restate the deload in the week's `instruction` text ("60 % of sets, RIR 3–4").
- **Sessions**: `kind: "training"` gets a Start button and drives "Up next" (the training session done least recently). `kind: "corrective"` is shown collapsed at the bottom of every running workout. `kind: "menu"` is a pick-list with no Start button.
- **Grouped blocks** (`superset`, `compound`, `circuit`) own the rest: put `rounds` and `restSec` on the block and omit `restSec` on their exercises. `straight` blocks hold exactly one exercise with its own `restSec`.
- **UI language is Persian (RTL).** `nameFa` is displayed first and `name` (English, catalog-style) underneath. Free text (`cue`, `notes`, `guidelines`, `rationale`, `warmup`, `cooldown`, week `label`/`instruction`, `goal`, `split`) is written in English and given a Persian twin (`cueFa`, `notesFa`, …; see `docs/plan-schema.md`), which the UI shows. Write plain Persian, no transliterated English.

## 3. Process (in this order; reason briefly, then output only JSON)

### 3.1 Assess
Trend of weight, SMM, PBF and visceral fat; segmental imbalances; posture flags; what the last block emphasized (rep ranges, rest, volume); adherence; gaps in history. Every decision you make later must trace back to a finding here (it goes into `meta.rationale`).

### 3.2 Goal and split
One-sentence goal for the block. Choose the split from the athlete's days per week:

| Days/week | Split | `weeklyTemplate` (index 0 = Saturday) |
|---|---|---|
| 2 | Full body A / B | `["full-a","rest","rest","full-b","rest","rest","rest"]` |
| 3 | Full body A / B / C (current Plan 4) | `["full-a","rest","full-b","rest","full-c","rest","rest"]` |
| 4 | Upper A / Lower A / Upper B / Lower B | `["upper-a","lower-a","rest","upper-b","lower-b","rest","rest"]` |

Never put the same muscle's heavy compound on consecutive days. Each major muscle should be trained at least 2× per week.

With 3 full-body days, give each day a different main pattern so no lift repeats heavy:
- **A**: knee-dominant squat (hack squat) + horizontal press (bench) + chest-supported row + leg curl + lateral/triceps superset + calf/abs superset.
- **B**: hip hinge (RDL) + incline press + vertical pull (pull-up/pulldown) + leg press + rear-delt/biceps superset + calf/abs superset.
- **C**: hip thrust + overhead press + seated cable row + unilateral leg (Bulgarian split squat, left leg first) + chest fly/leg curl superset + lateral/biceps/triceps circuit.

### 3.3 Weekly volume (hard working sets, count them)
- Count only working sets (not ramp-ups or correctives). In supersets and circuits, each exercise's `sets` counts for its own muscle.
- Count an exercise only for its **primary** muscle. Compounds give indirect work to helpers (presses → triceps/front delts, rows → biceps/rear delts, RDL/split squat → glutes); mention that in the rationale but do not add it to the count.
- Targets per week: chest, back, quads, hamstrings, glutes: **10–16** (counting the hinge and split squats toward glutes). Side delts, biceps, triceps, calves, abs: **6–10** direct is enough when compounds cover the rest. Put the athlete's two named weak points (from the context) at the top of the range.
- Plan 4 (3 days) came out at: back 13, chest 10, quads 10, hamstrings 9 (+ hip thrust/RDL), glutes via hip thrust 4 + RDL + split squats, calves 8, abs 8, side delts 6, biceps 6, triceps 6. List your own totals in the rationale.

### 3.4 Session time budget (≤ 75 min including warm-up)
- Fixed overhead ≈ 13 min: 5 min incline walk + ~6 min corrective activation + ramp-up sets.
- Straight sets ≈ 45 s work + `restSec`. Superset round ≈ sum of the work + block `restSec`. `perSide` doubles the work time.
- In practice that is **26–31 working sets per session**. Put the estimate in `durationMin` (≤ 75).

### 3.5 Exercise order inside a session
1. Heaviest compound (longest rest, tempo, ramp-up listed in `warmup`).
2. Second compound.
3. Third compound or machine compound.
4. Accessory for the antagonist or lagging muscle.
5. Isolation supersets (non-competing pairs, e.g. lateral raise + pushdown).
6. Calves + abs superset.
7. **Corrective finisher block** (held stretches; see 3.8).

### 3.6 Exercise selection
- Only equipment listed in the context. Every training exercise has an `exerciseId` and **two** `alternatives` ids (at least one), all verified in `public/data/exercises.json` (the test suite fails on unknown ids). Custom corrective drills may omit `exerciseId`.
- Alternatives are real substitutes: same movement pattern and primary muscle, different equipment where possible (machine → free weight / cable / Smith), so a missing or busy machine always has a fallback. The athlete picks them in the workout ("⇄ جایگزین"); the prescription (sets, reps, RIR, rest, tempo, progression) carries over unchanged, and `startLoadKg` and `cue` are dropped for the alternative, so do not write alternative-specific numbers anywhere.
- Prefer ids the athlete already has history for, so progression stays visible.
- Reuse existing `key`s for the same movement (`bench-press`, `rdl`, `hack-squat`, …).
- Unilateral work starts with the weaker (left) side; say so in the `cue`.
- Assisted machines: `progression: {"type":"reps"}`, log the assistance weight, and explain "when all sets hit the top, reduce assistance by 5 kg" in the `cue`. Never use negative numbers.

### 3.7 Prescription
| Type | Reps | RIR | Rest | Tempo | Progression |
|---|---|---|---|---|---|
| Main compounds | 6–8 or 8–10 (range) | 2 (→ 1 later in the block) | 120–180 s | `3-1-1` where control matters | double, upper +2.5 kg, lower +5 kg, leg press +10 kg |
| Dumbbell compounds | 8–10 | 2 | 120–150 s | `3-0-1` | double, +2 kg (next pair) |
| Isolation | 10–15 or 12–15 (15–20 for face pulls, abduction) | 1 | 60–90 s (or block rest) | `2-2-1` for calves | double, cables +1.25–2.5 kg, machines +2.5–5 kg |
| Bodyweight core | range or `seconds` | 1 | block rest | – | `reps` or `none` |
| Corrective drills | fixed reps or `seconds`, `perSide` when relevant | – | – | – | `none` |

Every exercise has a one-line `cue` (it is read on a phone between sets), and `nameFa` + `name`.

### 3.8 Correctives: what goes before lifting, what goes after
Rule (applied in Plan 4, keep it):
- **Before lifting: activation and mobility drills.** Low-fatigue, dynamic, about 6 min: e.g. dead bug with posterior pelvic tilt, glute bridge march, cat–cow + thoracic rotation, wall slide + lift-off. They set pelvis, ribs and shoulder blades in the position the lifts need, and they actually get done when they open the session. Put them in one `kind: "corrective"` session (first in `sessions`, one `circuit` block, 2 rounds, `progression: none`), and reference it in every training session's `warmup` as "Corrective activation (6 min)".
- **After lifting: held static stretches and fatiguing stability work.** Static holds of about 60 s or more per muscle right before heavy lifting can reduce force output, and the coach's rule says "no long static stretching before lifting". Fatiguing core or scapular endurance work before squats and RDLs pre-tires the stabilizers those lifts need. Put these in a final `straight` block of each training session with `"note": "Corrective, after lifting"` (Plan 4: half-kneeling hip-flexor stretch, 2 × 45 s per side), and list them first in `cooldown`.
- State this split in `meta.rationale` and in the corrective session's `notes`.

### 3.9 Periodization (`weeks[]`, cover every week)
Template used for 9 weeks; scale it for other lengths. Add a mid-block deload if the block is 8 weeks or longer.

| Week | Label | RIR | Note |
|---|---|---|---|
| 1 | Intro | 3 | find working loads, no failure |
| 2–4 | Accumulate | 2 → 1–2 | add load where easy, chase the top of the rep ranges |
| 5 | Deload | 3–4 | 60 % of sets, same loads, re-scan (`setMultiplier: 0.6`) |
| 6–7 | Intensify | 2 → 1–2 | resume from week-4 loads |
| 8 | Peak | 0–1 isolation, 1 compounds | best-effort week |
| 9 | Deload + re-test | 3–4 | 60 % of sets at −10 % load, re-scan, generate the next block (`setMultiplier: 0.6`, `loadMultiplier: 0.9`) |

### 3.10 Core menu
Keep one `kind: "menu"` session with 6–10 core options that have catalog ids. The name says when to use it (e.g. "pick 1 at the end of Full A or Full C").

### 3.11 Meta, rationale, guidelines
- `meta`: `source: "ai"`; `author` names the model; `createdAt` = today; `startDate` = a **Saturday**; `durationWeeks`; `daysPerWeek`; `split`; `goal` (one sentence with the target numbers); `tags`; `provenance` ("Generated YYYY-MM-DD following docs/ai/plan-generation-guide.md").
- `rationale`: 4–6 bullets, each tying a decision to a number (latest scan and deltas, previous rep ranges, posture flags, frequency and volume totals, recovery and NEAT).
- `guidelines` (in this order): warm-up sequence; how to pick loads for RIR and log every working set; double progression with increments; rest rules; ROM and tempo (no static stretching before lifting); conditioning (easy incline walk, after a session or on an off day); nutrition anchor from the context (kcal, protein g/day, water) with re-scan weeks; station-busy rule (use the alternative, log it under the same exercise).

## 4. Output format (exactly)
- Return **only the JSON**: no prose, no code fence. It is saved directly as `src/content/plans/<id>.json` or pasted into Plans → Import.
- UTF-8, 2-space indent, LF line endings, trailing newline; no comments or trailing commas.
- Key order follows the schema. **One exercise object per line** inside `exercises` and one week per line inside `weeks` (keeps diffs readable, see Plan 4).
- Skeleton:

```json
{
  "schemaVersion": 1,
  "id": "plan-5-<split-slug>-YYYY-MM",
  "name": "Plan 5 · …",
  "nameFa": "پلن ۵ · …",
  "meta": { "author": "…", "source": "ai", "createdAt": "YYYY-MM-DD", "startDate": "YYYY-MM-DD (Saturday)", "durationWeeks": 9, "daysPerWeek": 3, "split": "Full A / Full B / Full C", "goal": "…", "rationale": ["…"], "tags": ["…"], "provenance": "…" },
  "guidelines": ["…"],
  "weeklyTemplate": ["full-a", "rest", "full-b", "rest", "full-c", "rest", "rest"],
  "weeks": [
    { "week": 1, "label": "Intro", "instruction": "…", "rir": 3 }
  ],
  "sessions": [
    { "id": "corrective", "kind": "corrective", "…": "activation drills, one circuit block" },
    { "id": "full-a", "kind": "training", "…": "blocks …, last block = corrective finisher" },
    { "id": "full-b", "…": "…" },
    { "id": "full-c", "…": "…" },
    { "id": "core-menu", "kind": "menu", "…": "…" }
  ]
}
```

Session order in `sessions`: corrective, training sessions in weekly order, then menu.

## 5. Checklist before output
- [ ] `schemaVersion: 1`; new unique slug `id` with a year-month suffix (never reuse an id that has logs).
- [ ] `meta.source: "ai"`, `author` names the model, `startDate` is a Saturday, `daysPerWeek` matches the context.
- [ ] `weeklyTemplate` has 7 entries (Saturday first) using session ids or `"rest"`; no heavy same-muscle compounds on consecutive days.
- [ ] `weeks[]` covers every week; deload instructions restate the set and load reduction in text.
- [ ] Each training session: unique `id`, `name`, `nameFa`, `focus`, `durationMin` ≤ 75, `warmup` (walk, corrective activation, ramp-up), `blocks`, `cooldown`, and a final "Corrective, after lifting" block.
- [ ] Each exercise: unique `key` in its session, `name`, `nameFa`, `sets`, `reps` or `seconds`, `rir` (training work), `restSec` (straight blocks only), `progression`, `cue`; `exerciseId` + `alternatives` on training exercises.
- [ ] Weekly hard sets per muscle counted and within section 3.3; totals stated in the rationale.
- [ ] Session time estimate ≤ 75 min (section 3.4).
- [ ] Only equipment from the context; every catalog id exists.
- [ ] No negative numbers; assisted lifts use `progression.type: "reps"`.
- [ ] Valid JSON in the format of section 4.

## 6. Saving and validating (for agents with repo access)
1. Write `src/content/plans/<id>.json` and add it as the **first** entry of `raw` in `src/content/plans/index.ts` (first = default active plan for new installs).
2. Changing a bundled plan in place (same id) is fine **only before its `startDate`**. The app re-seeds unedited bundled plans when the file changes. Once a block has started, create a new id.
3. Run `npm run check` (schema + catalog-id tests) and `npm run build`; both must pass.
4. Update `docs/ai/athlete-context.md`: add the block to "Training history" and adjust constraints if they changed.
5. Without repo access: the athlete pastes the JSON into Plans → Import, which runs the same validation.

## 7. Coaching rules inherited from the athlete's coach (keep them)
- 5 min easy treadmill/elliptical + specific ramp-up before lifting; no long static stretching or long cardio before lifting.
- Choose loads to reach the stated reps with 0–3 RIR; full range of motion and correct technique.
- A desk job is sedentary even with 3–5 sessions/week: take NEAT seriously (8k+ steps on off days in guidelines).
- Easy cardio after sessions is acceptable but must not compromise lifting.

## 8. Frequently used catalog ids (verified in `public/data/exercises.json`)
Chest: 0025 barbell bench · 0047 incline barbell · 0314 incline DB press · 0289 DB bench · 0596 pec deck · 0319 incline DB fly · 2144 cable chest press · 0757 smith incline
Back: 2330 lat pulldown · 0579 lever front pulldown · 0673 reverse-grip machine pulldown · 0017 assisted pull-up · 0861 cable seated row · 0588 lever narrow row · 0581 lever high row · 0606 T-bar · 0292 one-arm DB row · 0238 straight-arm pulldown · 0233 rope rear-delt row (face pull) · 0602 machine reverse fly
Shoulders: 0405 seated DB press · 0603 machine press · 2137 Arnold · 0334 DB lateral · 0178 cable lateral · 0323 incline one-arm lateral · 0345 lying one-arm rear lateral · 3541 incline Y-raise · 0406 DB shrug · 0095 barbell shrug
Arms: 0447 EZ curl · 0031 barbell curl · 0315 incline DB curl · 0313 hammer · 1648 seated hammer · 0190 cable one-arm curl · 0195 cable preacher · 1616 machine preacher · 0080 reverse curl · 0200 rope pushdown · 0201 pushdown · 0241 V-bar pushdown · 0194 cable overhead rope ext · 0061 lying barbell ext · 0591 machine dip · 1723 one-arm pushdown
Legs: 0743 hack squat · 0755 smith hack · 0739 45° leg press · 0760 smith leg press · 0585 leg extension · 0599 seated leg curl · 0586 lying leg curl · 0085 barbell RDL · 1459 DB RDL · 0410 DB Bulgarian split squat · 1760 goblet squat · 3562 barbell hip thrust (bench) · 1409 barbell glute bridge · 2286 lever hip extension · 0597 seated hip abduction · 0605 standing calf · 0594 seated calf · 1375 cable calf
Core / corrective: 0175 cable kneeling crunch · 0212 machine crunch · 0277 decline crunch · 0242 cable reverse crunch · 0011 assisted hanging knee raise · 0472 hanging leg raise · 0857 ab wheel · 2133 farmer's walk · 0705 side bridge · 0464 plank with twist · 2466 cross-body climber · 0489 hyperextension · 0276 dead bug · 3561 glute bridge march · 3013 glute bridge · 3645 single-leg bridge · 3147 pelvic tilt · 1564 hip flexor stretch · 1471 inchworm
Cardio: 3666 incline treadmill walk · 2138 stationary bike · 2141 elliptical

Find other ids with the command in `docs/plan-schema.md` ("Finding catalog ids").
