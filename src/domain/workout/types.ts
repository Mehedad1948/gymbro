/** Persisted records. Flat and index-friendly for IndexedDB. */

export type WorkoutStatus = "active" | "done" | "abandoned";

export type Workout = {
  id: string;
  planId: string;
  sessionId: string;
  /** Snapshot so history survives plan edits. */
  sessionName: string;
  startedAt: number;
  finishedAt?: number;
  status: WorkoutStatus;
  notes?: string;
  /** Exercise key → catalog id actually performed instead of the prescribed one. */
  swaps?: Record<string, string>;
};

export type SetLog = {
  id: string;
  workoutId: string;
  planId: string;
  sessionId: string;
  /** Catalog `exerciseId` when known, else `custom:<key>`; joins history across plans. */
  exerciseKey: string;
  exerciseName: string;
  setIndex: number;
  weightKg?: number;
  reps?: number;
  seconds?: number;
  rir?: number;
  done: boolean;
  completedAt: number;
};

export function exerciseKeyOf(e: { exerciseId?: string; key: string }): string {
  return e.exerciseId ?? `custom:${e.key}`;
}
