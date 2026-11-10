/**
 * Where the athlete is in the plan's rotation of training sessions.
 *
 * A cycle is one pass through every training session. A session is "done" once
 * it has a finished workout in the current cycle; when every session is done,
 * the next finished workout opens a new cycle. This keeps the check marks
 * meaningful week after week instead of every session staying checked forever.
 */
export type CycleProgress = {
  /** Training session ids finished in the current cycle. */
  done: Set<string>;
  /** Most recently finished training session, with when it was finished. */
  last?: { sessionId: string; at: number };
  /** First training session, in plan order, not yet done in this cycle. */
  nextId?: string;
};

export function cycleProgress(
  trainingIds: readonly string[],
  finished: ReadonlyArray<{ sessionId: string; startedAt: number; finishedAt?: number }>,
): CycleProgress {
  const training = new Set(trainingIds);
  const ordered = [...finished].filter((w) => training.has(w.sessionId)).sort((a, b) => a.startedAt - b.startedAt);
  let done = new Set<string>();
  for (const w of ordered) {
    if (done.size === training.size) done = new Set();
    done.add(w.sessionId);
  }
  const lastW = ordered.at(-1);
  const last = lastW && { sessionId: lastW.sessionId, at: lastW.finishedAt ?? lastW.startedAt };
  const allDone = training.size > 0 && done.size === training.size;
  const nextId = allDone ? trainingIds[0] : trainingIds.find((id) => !done.has(id));
  return { done, last, nextId };
}
