# Plan generation guide (for AI agents)

You are generating the next training block for one athlete. Output must be a single JSON document that validates against `docs/plan-schema.md`, nothing else. Read `docs/ai/athlete-context.md` first; it holds the body scans, equipment, history and constraints. If workout logs are attached, use them.

## Inputs you should have
1. `athlete-context.md` (profile, equipment, scan table, training history, constraints).
2. The previous plan JSON (so you can keep what worked and change what did not).
3. Set logs export (optional): best set per exercise per week. Use them for `startLoadKg` and to decide which lifts to keep.

If 1 is missing, stop and ask for it. Do not invent scan numbers.

## Process (do it in this order, briefly reason, then output JSON)
1. **Assess**: trend of weight, SMM, PBF, visceral fat; segmental imbalances; posture flags; what the last block emphasized; adherence.
2. **Decide the goal** for the block (one sentence) and the split/frequency that fits `daysPerWeek` in the context.
3. **Set volume**: 10–16 hard sets per muscle group per week; count supersets per exercise. Prioritize the two weak points named in the context.
4. **Pick exercises** from the gym equipment list; prefer catalog ids the athlete already has history for (continuity makes progression visible). Every training exercise needs an `exerciseId` and one `alternatives` id. Custom drills (correctives) may omit ids.
5. **Prescribe**: compounds 5–10 reps, RIR 2→1 across weeks, rest 120–180 s; isolation 10–20 reps, RIR 1–0, rest 60–90 s; timed work in `seconds`. Include `tempo` where control matters, a one-line `cue` on every exercise, and a `progression` rule.
6. **Periodize**: fill `weeks[]` for the whole block with an intro week (RIR 3), progressive weeks, a mid deload if ≥ 8 weeks, and a final deload + re-test. Use `setMultiplier`/`loadMultiplier` for deloads.
7. **Correctives**: keep a `kind: "corrective"` session (5–8 min) built from the coach's corrective sheets in the context, adapted to the current findings. Put it first in `sessions`.
8. **Core menu**: keep a `kind: "menu"` session of 6–10 options with catalog ids.
9. **Write `meta.rationale`**: 3–6 bullets tying decisions to numbers (scan deltas, previous rep ranges, posture flags). Write `guidelines` (warm-up, RIR, rest, nutrition anchor, re-scan dates).
10. **Self-check** against the checklist below, then output only the JSON.

## Checklist before output
- [ ] `schemaVersion: 1`, unique slug `id` with date suffix (e.g. `plan-5-upper-lower-2027-02`).
- [ ] `meta.source: "ai"`, `meta.author` names the model, `meta.startDate` is a Saturday (athlete's week starts Saturday).
- [ ] `weeklyTemplate` has 7 entries using session ids or `"rest"`.
- [ ] Each session: unique `id`, `name`, `nameFa`, `focus`, `durationMin` ≤ 75, `warmup`, `blocks`.
- [ ] Each exercise: unique `key`, `name`, `nameFa`, `sets`, `reps` or `seconds`, `rir`, `restSec` (or block `restSec` for grouped blocks), `progression`, `cue`.
- [ ] Weekly hard sets per muscle within 10–16; no muscle trained on consecutive days with heavy compounds.
- [ ] Only equipment listed in the context; machines named as the catalog names them.
- [ ] No negative numbers anywhere (assistance lifts use `progression.type: "reps"` and explain the assistance rule in `cue`).
- [ ] Valid JSON, no comments, no trailing commas.

## Coaching rules inherited from the athlete's coach (keep them)
- 5 min easy treadmill/elliptical + specific ramp-up before lifting; no long static stretching or long cardio before lifting.
- Choose loads to reach the stated reps with 0–3 RIR; full range of motion and correct technique.
- A desk job is sedentary even with 4–5 sessions/week: take NEAT seriously (steps target in guidelines).
- 20 min easy cardio after sessions is acceptable but should not compromise lifting.

## Frequently used catalog ids (verified in `public/data/exercises.json`)
Chest: 0025 barbell bench · 0047 incline barbell · 0314 incline DB press · 0289 DB bench · 0596 pec deck · 0319 incline DB fly · 2144 cable chest press · 0757 smith incline
Back: 2330 lat pulldown · 0579 lever front pulldown · 0673 reverse-grip machine pulldown · 0017 assisted pull-up · 0861 cable seated row · 0588 lever narrow row · 0581 lever high row · 0606 T-bar · 0292 one-arm DB row · 0238 straight-arm pulldown · 0233 rope rear-delt row (face pull) · 0602 machine reverse fly
Shoulders: 0405 seated DB press · 0603 machine press · 2137 Arnold · 0334 DB lateral · 0178 cable lateral · 0323 incline one-arm lateral · 0345 lying one-arm rear lateral · 3541 incline Y-raise · 0406 DB shrug · 0095 barbell shrug
Arms: 0447 EZ curl · 0031 barbell curl · 0315 incline DB curl · 0313 hammer · 1648 seated hammer · 0190 cable one-arm curl · 0195 cable preacher · 1616 machine preacher · 0080 reverse curl · 0200 rope pushdown · 0201 pushdown · 0241 V-bar pushdown · 0194 cable overhead rope ext · 0061 lying barbell ext · 0591 machine dip · 1723 one-arm pushdown
Legs: 0743 hack squat · 0755 smith hack · 0739 45° leg press · 0760 smith leg press · 0585 leg extension · 0599 seated leg curl · 0586 lying leg curl · 0085 barbell RDL · 1459 DB RDL · 0410 DB Bulgarian split squat · 1760 goblet squat · 3562 barbell hip thrust (bench) · 1409 barbell glute bridge · 2286 lever hip extension · 0597 seated hip abduction · 0605 standing calf · 0594 seated calf · 1375 cable calf
Core / corrective: 0175 cable kneeling crunch · 0212 machine crunch · 0277 decline crunch · 0242 cable reverse crunch · 0011 assisted hanging knee raise · 0472 hanging leg raise · 0857 ab wheel · 2133 farmer's walk · 0705 side bridge · 0464 plank with twist · 2466 cross-body climber · 0489 hyperextension · 0276 dead bug · 3561 glute bridge march · 3013 glute bridge · 3645 single-leg bridge · 3147 pelvic tilt · 1564 hip flexor stretch · 1471 inchworm
Cardio: 3666 incline treadmill walk · 2138 stationary bike · 2141 elliptical

## Output format
Return only the JSON (no prose, no code fence) so it can be saved directly as `src/content/plans/<id>.json` or pasted into Plans → Import.
