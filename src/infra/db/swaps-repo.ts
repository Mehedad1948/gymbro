import { db } from "./database";

/** Exercise key → catalog id. */
export type SwapMap = Record<string, string>;

/** Plan-wide defaults live in `settings` under this key (e.g. the gym lacks a machine). */
export const planSwapsKey = (planId: string) => `swaps:${planId}`;

export const swapsRepo = {
  /**
   * Perform `toId` for exercise `key` in this workout. Sets already logged
   * for the exercise in this workout move with it, unless the target already
   * has its own sets here (then both stay as logged).
   */
  async choose(input: { workoutId: string; key: string; fromKey: string; toId: string; toName: string }): Promise<void> {
    const { workoutId, key, fromKey, toId, toName } = input;
    await db().transaction("rw", db().workouts, db().setLogs, async () => {
      const w = await db().workouts.get(workoutId);
      if (!w) return;
      await db().workouts.update(workoutId, { swaps: { ...w.swaps, [key]: toId } });
      if (fromKey === toId) return;
      const taken = await db().setLogs.where("[workoutId+exerciseKey]").equals([workoutId, toId]).count();
      if (taken > 0) return;
      await db()
        .setLogs.where("[workoutId+exerciseKey]")
        .equals([workoutId, fromKey])
        .modify({ exerciseKey: toId, exerciseName: toName });
    });
  },

  /** Default choice for exercise `key` in every future workout of the plan; `undefined` clears it. */
  async setDefault(planId: string, key: string, id: string | undefined): Promise<void> {
    await db().transaction("rw", db().settings, async () => {
      const current = ((await db().settings.get(planSwapsKey(planId)))?.value ?? {}) as SwapMap;
      const next = { ...current };
      if (id) next[key] = id;
      else delete next[key];
      await db().settings.put({ key: planSwapsKey(planId), value: next });
    });
  },
};
