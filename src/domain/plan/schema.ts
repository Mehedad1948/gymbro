import { z } from "zod";

/**
 * Plan contract (schemaVersion 1).
 *
 * This is THE interface between plan authors (coach, AI agent, the athlete)
 * and the app. Anything that validates against `PlanSchema` can be imported.
 * Design goals:
 *   - compact enough for an LLM to author reliably,
 *   - expressive enough to encode real coaching plans (supersets, rep ladders,
 *     time-based sets, RIR targets, progression rules),
 *   - independent of storage (no DB ids, no logs).
 *
 * Human-readable description: docs/plan-schema.md
 */

export const PLAN_SCHEMA_VERSION = 1 as const;

const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, digits and dashes");

/** Catalog id from hasaneyldrm/exercises-dataset, e.g. "0025". */
export const CatalogIdSchema = z.string().regex(/^\d{4}$/);

/**
 * Rep prescription: fixed number, ascending [min,max] range, or a per-set
 * ladder like [12,10,8,8]. A descending/equal 2-item array is a ladder.
 */
export const RepsSchema = z.union([
  z.number().int().positive(),
  z.array(z.number().int().positive()).min(1).max(12),
]);

/** Reps in reserve target: a number or [min,max]. */
export const RirSchema = z.union([
  z.number().min(0).max(10),
  z.tuple([z.number().min(0).max(10), z.number().min(0).max(10)]),
]);

export const ProgressionSchema = z.discriminatedUnion("type", [
  z.object({
    /** Double progression: fill the rep range at a load, then add weight. */
    type: z.literal("double"),
    incrementKg: z.number().positive().default(2.5),
  }),
  z.object({
    /** Add reps each week, hold load (bodyweight / rehab work). */
    type: z.literal("reps"),
    incrementReps: z.number().int().positive().default(1),
  }),
  z.object({ type: z.literal("none") }),
]);

export const PlanExerciseSchema = z
  .object({
    /** Stable key inside the session, used to join logs. */
    key: slug,
    name: z.string().min(1),
    /** Optional localized display name (Persian in this project). */
    nameFa: z.string().optional(),
    /** Catalog id for the movement guide; omit for custom / corrective drills. */
    exerciseId: CatalogIdSchema.optional(),
    /** Acceptable swaps when the station is busy (catalog ids). */
    alternatives: z.array(CatalogIdSchema).optional(),
    equipment: z.string().optional(),
    sets: z.number().int().min(1).max(12),
    reps: RepsSchema.optional(),
    /** Time-based sets (planks, holds, cardio) in seconds. */
    seconds: z.number().int().positive().optional(),
    /** Per-side movements (lunges, single-leg work). */
    perSide: z.boolean().optional(),
    rir: RirSchema.optional(),
    tempo: z
      .string()
      .regex(/^\d-\d-\d(-\d)?$/)
      .optional(),
    restSec: z.number().int().min(0).max(600).optional(),
    progression: ProgressionSchema.optional(),
    /** Starting load hint in kg. The app shows the last logged load anyway. */
    startLoadKg: z.number().nonnegative().optional(),
    cue: z.string().optional(),
    cueFa: z.string().optional(),
  })
  .refine((e) => e.reps !== undefined || e.seconds !== undefined, {
    message: "an exercise needs reps or seconds",
  });

export const BlockTypeSchema = z.enum([
  "straight", // one exercise, all sets, rest between
  "superset", // 2 exercises alternated, rest after the pair
  "compound", // 2 exercises for the same muscle back-to-back
  "circuit", // 3+ exercises, rest after the round
]);

export const BlockSchema = z.object({
  type: BlockTypeSchema.default("straight"),
  /** Rounds for superset/circuit; straight blocks use exercise.sets. */
  rounds: z.number().int().min(1).max(10).optional(),
  restSec: z.number().int().min(0).max(600).optional(),
  note: z.string().optional(),
  noteFa: z.string().optional(),
  exercises: z.array(PlanExerciseSchema).min(1),
});

export const SessionKindSchema = z.enum([
  "training",
  "corrective",
  "conditioning",
  "menu", // "pick 1-2 of these" lists, e.g. the core menu
]);

export const SessionSchema = z.object({
  id: slug,
  name: z.string().min(1),
  nameFa: z.string().optional(),
  kind: SessionKindSchema.default("training"),
  /** Muscle / quality focus, free text for the UI and the AI. */
  focus: z.array(z.string()).optional(),
  durationMin: z.number().int().positive().optional(),
  warmup: z.array(z.string()).optional(),
  warmupFa: z.array(z.string()).optional(),
  blocks: z.array(BlockSchema).min(1),
  cooldown: z.array(z.string()).optional(),
  cooldownFa: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
  notesFa: z.array(z.string()).optional(),
});

export const WeekOverrideSchema = z.object({
  week: z.number().int().min(1),
  label: z.string().optional(),
  labelFa: z.string().optional(),
  /** e.g. "RIR 2" or "deload: half the sets, -10 % load" */
  instruction: z.string(),
  instructionFa: z.string().optional(),
  rir: RirSchema.optional(),
  setMultiplier: z.number().positive().max(1.5).optional(),
  loadMultiplier: z.number().positive().max(1.5).optional(),
});

export const PlanMetaSchema = z.object({
  author: z.string().min(1),
  source: z.enum(["coach", "ai", "self"]),
  createdAt: z.iso.date(),
  startDate: z.iso.date().optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  split: z.string().optional(),
  splitFa: z.string().optional(),
  goal: z.string().optional(),
  goalFa: z.string().optional(),
  /** Why this plan looks the way it does (analysis summary, constraints). */
  rationale: z.array(z.string()).optional(),
  rationaleFa: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  /** Where the original came from (PDF name, chat link, …). */
  provenance: z.string().optional(),
});

export const PlanSchema = z
  .object({
    schemaVersion: z.literal(PLAN_SCHEMA_VERSION),
    id: slug,
    name: z.string().min(1),
    nameFa: z.string().optional(),
    meta: PlanMetaSchema,
    /** General rules shown before every session (warm-up, RIR, etc.). */
    guidelines: z.array(z.string()).optional(),
    guidelinesFa: z.array(z.string()).optional(),
    /** Suggested weekly order of session ids, "rest" allowed. */
    weeklyTemplate: z.array(z.string()).optional(),
    weeks: z.array(WeekOverrideSchema).optional(),
    sessions: z.array(SessionSchema).min(1),
  })
  .superRefine((plan, ctx) => {
    const ids = new Set<string>();
    for (const s of plan.sessions) {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: `duplicate session id ${s.id}` });
      ids.add(s.id);
      const keys = new Set<string>();
      for (const b of s.blocks)
        for (const e of b.exercises) {
          if (keys.has(e.key))
            ctx.addIssue({ code: "custom", message: `duplicate exercise key ${e.key} in ${s.id}` });
          keys.add(e.key);
        }
    }
    for (const id of plan.weeklyTemplate ?? []) {
      if (id !== "rest" && !ids.has(id))
        ctx.addIssue({ code: "custom", message: `weeklyTemplate references unknown session ${id}` });
    }
  });

export type Plan = z.infer<typeof PlanSchema>;
export type PlanInput = z.input<typeof PlanSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type PlanExercise = z.infer<typeof PlanExerciseSchema>;
export type Reps = z.infer<typeof RepsSchema>;
export type Rir = z.infer<typeof RirSchema>;
export type WeekOverride = z.infer<typeof WeekOverrideSchema>;
