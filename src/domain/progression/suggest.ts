import type { PlanExercise } from "../plan/schema";
import { repRangeOf, rirMax } from "../plan/sets";
import type { SetLog } from "../workout/types";

export type Suggestion = {
  weightKg?: number;
  reason: string;
  /** "up" = add load, "hold" = repeat load, "none" = no history. */
  direction: "up" | "hold" | "none";
};

/**
 * Double progression: when every working set of the last performance reached
 * the top of the rep range at or below the target RIR, add the increment.
 * Otherwise repeat the load and chase reps. Pure function, unit tested.
 */
export function suggestNext(ex: PlanExercise, lastSets: SetLog[]): Suggestion {
  const done = lastSets.filter((s) => s.done && s.weightKg !== undefined);
  if (done.length === 0) return { direction: "none", reason: "No history yet" };

  const lastWeight = Math.max(...done.map((s) => s.weightKg ?? 0));
  const prog = ex.progression ?? { type: "double" as const, incrementKg: 2.5 };
  if (prog.type === "none") return { weightKg: lastWeight, direction: "hold", reason: "No progression rule" };
  if (prog.type === "reps")
    return { weightKg: lastWeight, direction: "hold", reason: `Add ${prog.incrementReps} rep(s)` };

  const range = repRangeOf(ex.reps);
  if (!range) return { weightKg: lastWeight, direction: "hold", reason: "Time-based" };
  const top = range[1];
  const targetRir = rirMax(ex.rir);

  const atTopLoad = done.filter((s) => s.weightKg === lastWeight);
  const allHitTop = atTopLoad.length >= ex.sets && atTopLoad.every((s) => (s.reps ?? 0) >= top);
  const rirOk =
    targetRir === undefined || atTopLoad.every((s) => s.rir === undefined || s.rir <= targetRir);

  if (allHitTop && rirOk) {
    return {
      weightKg: roundQuarter(lastWeight + prog.incrementKg),
      direction: "up",
      reason: `All ${ex.sets} sets hit ${top} reps → +${prog.incrementKg} kg`,
    };
  }
  return { weightKg: lastWeight, direction: "hold", reason: `Repeat ${lastWeight} kg, aim for ${top} reps` };
}

function roundQuarter(n: number): number {
  return Math.round(n * 4) / 4;
}
