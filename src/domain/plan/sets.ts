import type { PlanExercise, Reps, Rir } from "./schema";

export type SetTarget = {
  index: number;
  reps?: number;
  repRange?: [number, number];
  seconds?: number;
  rir?: number;
};

export function rirMax(rir: Rir | undefined): number | undefined {
  if (rir === undefined) return undefined;
  return Array.isArray(rir) ? rir[1] : rir;
}

/** An ascending 2-item array is a range; anything else is a per-set ladder. */
export function isRange(reps: Reps | undefined): reps is [number, number] {
  return Array.isArray(reps) && reps.length === 2 && reps[0] < reps[1];
}

export function repRangeOf(reps: Reps | undefined): [number, number] | undefined {
  if (reps === undefined) return undefined;
  if (typeof reps === "number") return [reps, reps];
  if (isRange(reps)) return [reps[0], reps[1]];
  return [Math.min(...reps), Math.max(...reps)];
}

/** Expand a prescription into concrete per-set targets. */
export function expandSets(ex: PlanExercise): SetTarget[] {
  const out: SetTarget[] = [];
  const rir = rirMax(ex.rir);
  for (let i = 0; i < ex.sets; i++) {
    const t: SetTarget = { index: i, rir };
    if (ex.seconds) t.seconds = ex.seconds;
    const reps = ex.reps;
    if (typeof reps === "number") t.reps = reps;
    else if (isRange(reps)) t.repRange = [reps[0], reps[1]];
    else if (Array.isArray(reps)) t.reps = reps[Math.min(i, reps.length - 1)];
    out.push(t);
  }
  return out;
}

export function formatReps(ex: PlanExercise): string {
  const side = ex.perSide ? "/side" : "";
  if (ex.seconds) return `${ex.sets} × ${ex.seconds}s${side}`;
  const r = ex.reps;
  if (r === undefined) return `${ex.sets} sets`;
  if (typeof r === "number") return `${ex.sets} × ${r}${side}`;
  if (isRange(r)) return `${ex.sets} × ${r[0]}–${r[1]}${side}`;
  return r.join("-");
}

export function formatRest(sec: number | undefined): string | undefined {
  if (sec === undefined) return undefined;
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m${s}s` : `${m} min`;
}
