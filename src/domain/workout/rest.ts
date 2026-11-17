import type { Block } from "../plan/schema";

/**
 * Rest to start after ticking set `setIndex` of exercise `exKey` in `block`,
 * or `null` when no rest is due yet. `sec` is undefined when the plan sets none.
 *
 * Straight blocks rest after every set (the exercise's own rest, else the
 * block's). Superset / compound / circuit blocks rest only once the whole
 * round is done: every exercise in the block has that set ticked (an exercise
 * with fewer sets counts as done for the extra rounds). The round rest is the
 * block's, falling back to the exercise's.
 */
export function restAfterSet(
  block: Pick<Block, "type" | "restSec"> & { exercises: { key: string; sets: number; restSec?: number }[] },
  exKey: string,
  setIndex: number,
  isDone: (exKey: string, setIndex: number) => boolean,
): { sec?: number } | null {
  const ex = block.exercises.find((e) => e.key === exKey);
  if (!ex) return null;
  if (block.type === "straight" || block.exercises.length < 2) return { sec: ex.restSec ?? block.restSec };
  const roundDone = block.exercises.every((e) => e.key === exKey || e.sets <= setIndex || isDone(e.key, setIndex));
  return roundDone ? { sec: block.restSec ?? ex.restSec } : null;
}
