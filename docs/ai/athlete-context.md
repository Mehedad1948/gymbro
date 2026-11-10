# Athlete context

Keep this file current; it is the only context an AI plan generator gets about the person. Update after every body scan and at the end of every block.

## Profile
- Male, born ~1996 (age 29 in Dec 2025), 175 cm. Desk job (sedentary outside training). Trains in a commercial gym in Iran; weeks start on Saturday.
- Training age: restarted Oct 2025 with a coach (Sajjad Ferdowsi). Comfortable with machines, cables, dumbbells, barbell bench. Compound barbell lifts (squat/deadlift) were not programmed by the coach; introduce them progressively.
- Posture / corrective flags (from three coach corrective sheets): anterior pelvic tilt, tight hip flexors, limited thoracic extension, weak scapular control. Correctives prescribed: pelvic tilts, glute bridge march, cat-cow + thoracic extension, wall angels/slides, hip-flexor stretch, split-squat isometrics, dead bug, single-leg bridge hold.
- Segmental scan: arms and legs balanced within 0.2 kg; left arm slightly less lean (2.6 vs 2.8 kg). Start unilateral work with the left side.
- No injuries recorded. (Add here if any.)

## Gym equipment available
Treadmill, elliptical, stationary bike · flat/incline/decline benches · dumbbells (to ~40 kg) · barbells, EZ bar, plates · Smith machine · hack squat (sled) · 45° leg press · leg extension, seated and lying leg curl · hip thrust/extension machine · seated hip abduction/adduction · standing and seated calf machines · lat pulldown, assisted pull-up/dip, cable seated row, lever high row ("H" machine), T-bar · chest press, incline chest press, pec deck, machine reverse fly · machine shoulder press, lever lateral raise · machine preacher curl, machine dip · dual cable crossover with rope, D-handles, straight and V bars · ab crunch machine, decline bench, hanging knee-raise station, ab wheel · stability ball, bosu, bands, foam roller.
(If something is missing from your gym, delete it here.)

## Body composition history (Anea BIA, "standard" body type throughout)
| Date | Weight kg | SMM kg | Body fat kg | PBF % | BMI | Visceral fat cm² | BMR kcal | Note |
|---|---|---|---|---|---|---|---|---|
| 2025-09-28 | 66.2 | 28.3 | 14.7 | 22.2 | 21.6 | 67.7 | 1466 | baseline, before plan 1 |
| 2025-11-03 | 66.8 | 28.6 | 15.0 | 22.5 | | | | during plan 1 |
| 2025-12-21 | 66.0 | 29.0 | 12.8 | 19.4 | 21.6 | 60.1 | 1489 | end of plan 2 |
| 2026-01-28 | 65.5 | 28.9 | | 18.9 | | | | during plan 3 |
| 2026-04-12 | 65.0 | 28.8 | | 18.8 | | | | |
| 2026-07-12 | 67.2 | 29.5 | | 19.9 | | | | |
| 2026-08-28 | 67.4 | 30.0 | 11.6 | 17.2 | 22.0 | 58.1 | 1515 | latest; protein 10.6 kg, TBW 38.8 L, ECW/TBW 0.37, Anea score 85 |

Targets for 2026-11 → 2027-01: SMM ≥ 31 kg, PBF ≤ 17 %, weight 68–69 kg.

## Training history
| Block | Dates | Structure | Key features | Source |
|---|---|---|---|---|
| Plan 1 | 2025-10-08 → ~2025-11-20 | Full body ×3/wk | 3×12 everything, 1 min rest, 20 min treadmill after; machine-based | `src/content/plans/plan-1-full-body-2025-10.json` |
| Plan 2 | 2025-11-22 → ~2026-01-05 | Push / Legs / Pull | 3–4 sets, 10–20 reps, first supersets and compound sets, bodyweight squats 4×20 | `plan-2-three-day-split-2025-11.json` |
| Plan 3 | 2026-01-07 → ~2026-02-20 | Chest-tri / Back-bi / Shoulders-traps / Legs | 4 days, 8–15 reps, assisted pull-ups, Arnold press, Bulgarian split squats (BW) | `plan-3-four-day-split-2026-01.json` |
| Gap | 2026-02 → 2026-11 | Unknown / unlogged | Scans show weight +2 kg, SMM +1.2 kg, PBF −1.6 % over this period, so training continued in some form. **Ask the athlete and fill in.** | |
| Plan 4 | 2026-11-14 → 2027-01-16 | Full body ×3 (A/B/C), 9 weeks | First block with RIR targets per week, 6–10 rep compounds, double progression, logged loads. Planned as Upper/Lower ×4, switched to 3 days/week before it started. Correctives split: activation drills before lifting, hip-flexor stretch after | `plan-4-upper-lower-2026-11.json` |

No set loads were recorded before Plan 4. From Plan 4 on, export the app data (Settings → Export) and attach the best sets per exercise when requesting the next block.

## Nutrition anchor (used in guidelines, not a diet plan)
BMR 1515 kcal → maintenance ≈ 2 100–2 300 kcal (sedentary + 3–4 sessions). Lean-gain target 2 350–2 500 kcal, protein 130–145 g/day, re-scan every 4–5 weeks.

## Constraints and preferences
- Session length ≤ 75 min including warm-up. Currently trains 3 days/week (athlete's choice, 2026-11); 4 is the maximum that fits the schedule.
- Prefers machines/cables for isolation, open to barbell compounds if coached through ramp-up sets.
- Plans are read on the phone during training: keep cues to one line and names bilingual (`name` + `nameFa`).
