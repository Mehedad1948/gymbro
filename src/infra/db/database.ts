import Dexie, { type EntityTable } from "dexie";
import type { Plan } from "@/domain/plan";
import type { SetLog, Workout } from "@/domain/workout/types";

/** Stored plan: the validated document plus local bookkeeping. */
export type PlanRecord = {
  id: string;
  name: string;
  doc: Plan;
  /** "bundled" plans ship with the app, "imported" came from JSON paste/file. */
  origin: "bundled" | "imported";
  /** Hash of the bundled doc so re-seeding only touches untouched copies. */
  bundledHash?: string;
  userEdited: boolean;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
};

export type SettingRecord = { key: string; value: unknown };

/**
 * Single IndexedDB database. Versioned schema: when you change indexes,
 * bump the version and add an `.upgrade()` if data must migrate.
 * Only indexed fields are listed; records may hold more.
 */
export class GymbroDB extends Dexie {
  plans!: EntityTable<PlanRecord, "id">;
  workouts!: EntityTable<Workout, "id">;
  setLogs!: EntityTable<SetLog, "id">;
  settings!: EntityTable<SettingRecord, "key">;

  constructor() {
    super("gymbro");
    this.version(1).stores({
      plans: "id, updatedAt, archivedAt",
      workouts: "id, planId, status, startedAt, [planId+sessionId]",
      setLogs: "id, workoutId, exerciseKey, completedAt, [exerciseKey+completedAt], [workoutId+exerciseKey]",
      settings: "key",
    });
  }
}

let instance: GymbroDB | undefined;

/** Lazy singleton so server rendering never touches IndexedDB. */
export function db(): GymbroDB {
  if (!instance) instance = new GymbroDB();
  return instance;
}
