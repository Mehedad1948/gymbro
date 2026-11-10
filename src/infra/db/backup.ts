import { db } from "./database";

export type Backup = {
  app: "gymbro";
  version: 1;
  exportedAt: string;
  plans: unknown[];
  workouts: unknown[];
  setLogs: unknown[];
  settings: unknown[];
};

/** Everything the user owns, as one JSON document. */
export async function exportBackup(): Promise<Backup> {
  const [plans, workouts, setLogs, settings] = await Promise.all([
    db().plans.toArray(),
    db().workouts.toArray(),
    db().setLogs.toArray(),
    db().settings.toArray(),
  ]);
  return { app: "gymbro", version: 1, exportedAt: new Date().toISOString(), plans, workouts, setLogs, settings };
}

export async function importBackup(raw: unknown): Promise<void> {
  const b = raw as Partial<Backup>;
  if (b?.app !== "gymbro" || b.version !== 1) throw new Error("Not a gymbro backup");
  await db().transaction("rw", [db().plans, db().workouts, db().setLogs, db().settings], async () => {
    await db().plans.bulkPut((b.plans ?? []) as never[]);
    await db().workouts.bulkPut((b.workouts ?? []) as never[]);
    await db().setLogs.bulkPut((b.setLogs ?? []) as never[]);
    await db().settings.bulkPut((b.settings ?? []) as never[]);
  });
}

export async function wipeAll(): Promise<void> {
  await db().delete();
  await db().open();
}
