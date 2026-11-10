import type { SetLog, Workout } from "@/domain/workout/types";
import { db } from "./database";
import { newId } from "@/shared/lib/ids";

export const workoutsRepo = {
  get: (id: string) => db().workouts.get(id),

  async start(input: { planId: string; sessionId: string; sessionName: string }): Promise<Workout> {
    const w: Workout = { id: newId(), ...input, startedAt: Date.now(), status: "active" };
    await db().workouts.add(w);
    return w;
  },

  activeFor: (planId: string) =>
    db().workouts.where("planId").equals(planId).and((w) => w.status === "active").first(),

  finish: (id: string, status: "done" | "abandoned" = "done") =>
    db().workouts.update(id, { status, finishedAt: Date.now() }),

  recent: (limit = 50) => db().workouts.orderBy("startedAt").reverse().limit(limit).toArray(),

  lastForSession: (planId: string, sessionId: string) =>
    db()
      .workouts.where("[planId+sessionId]")
      .equals([planId, sessionId])
      .and((w) => w.status === "done")
      .reverse()
      .sortBy("startedAt")
      .then((ws) => ws[0]),

  async remove(id: string) {
    await db().transaction("rw", db().workouts, db().setLogs, async () => {
      await db().setLogs.where("workoutId").equals(id).delete();
      await db().workouts.delete(id);
    });
  },
};

export const setLogsRepo = {
  forWorkout: (workoutId: string) => db().setLogs.where("workoutId").equals(workoutId).sortBy("setIndex"),

  put: (log: SetLog) => db().setLogs.put(log),

  async upsertSet(input: Omit<SetLog, "id" | "completedAt"> & { id?: string }): Promise<SetLog> {
    const existing =
      input.id ??
      (
        await db()
          .setLogs.where("[workoutId+exerciseKey]")
          .equals([input.workoutId, input.exerciseKey])
          .and((s) => s.setIndex === input.setIndex)
          .first()
      )?.id;
    const log: SetLog = { ...input, id: existing ?? newId(), completedAt: Date.now() };
    await db().setLogs.put(log);
    return log;
  },

  /**
   * Last completed workout's sets for an exercise, excluding the current workout.
   * Used for the "previous" column and the progression suggestion.
   */
  async lastPerformance(exerciseKey: string, excludeWorkoutId?: string): Promise<SetLog[]> {
    const logs = await db()
      .setLogs.where("[exerciseKey+completedAt]")
      .between([exerciseKey, Dexie_MIN], [exerciseKey, Dexie_MAX])
      .reverse()
      .toArray();
    const first = logs.find((l) => l.done && l.workoutId !== excludeWorkoutId);
    if (!first) return [];
    return logs.filter((l) => l.workoutId === first.workoutId).sort((a, b) => a.setIndex - b.setIndex);
  },

  /** Full history for an exercise (for charts / progress view). */
  history: (exerciseKey: string, limit = 200) =>
    db()
      .setLogs.where("[exerciseKey+completedAt]")
      .between([exerciseKey, Dexie_MIN], [exerciseKey, Dexie_MAX])
      .reverse()
      .limit(limit)
      .toArray(),
};

const Dexie_MIN = -Infinity;
const Dexie_MAX = Infinity;
