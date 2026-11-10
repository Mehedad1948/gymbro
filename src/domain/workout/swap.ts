import type { PlanExercise } from "../plan/schema";

/** Catalog ids the athlete may perform for this exercise: the prescribed one first, then its alternatives. */
export function swapOptions(ex: PlanExercise): string[] {
  if (!ex.exerciseId) return [];
  return [...new Set([ex.exerciseId, ...(ex.alternatives ?? [])])];
}

/** The id actually performed: a valid choice wins, anything else falls back to the prescription. */
export function resolveSwap(ex: PlanExercise, chosenId: string | undefined): string | undefined {
  return chosenId && swapOptions(ex).includes(chosenId) ? chosenId : ex.exerciseId;
}

/**
 * The exercise as performed when an alternative is chosen. The prescription
 * (sets, reps, RIR, rest, tempo, progression) stays; the catalog id changes,
 * so logs, "previous" and load suggestions follow the alternative's own
 * history. Start load, cue and Persian name belong to the original movement
 * and are dropped.
 */
export function applySwap(ex: PlanExercise, alt: { id: string; name: string; equipment?: string } | undefined): PlanExercise {
  if (!alt || alt.id === ex.exerciseId) return ex;
  return {
    ...ex,
    exerciseId: alt.id,
    name: alt.name,
    nameFa: undefined,
    equipment: alt.equipment ?? ex.equipment,
    startLoadKg: undefined,
    cue: undefined,
  };
}
