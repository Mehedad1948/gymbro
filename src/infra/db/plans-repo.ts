import type { Plan } from "@/domain/plan";
import { db, type PlanRecord } from "./database";
import { newId } from "@/shared/lib/ids";

export const ACTIVE_PLAN_KEY = "activePlanId";

export const plansRepo = {
  all: () => db().plans.filter((p) => !p.archivedAt).toArray(),
  get: (id: string) => db().plans.get(id),

  async upsertImported(plan: Plan): Promise<PlanRecord> {
    const now = Date.now();
    const existing = await db().plans.get(plan.id);
    const rec: PlanRecord = {
      id: plan.id,
      name: plan.name,
      doc: plan,
      origin: existing?.origin ?? "imported",
      bundledHash: existing?.bundledHash,
      userEdited: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await db().plans.put(rec);
    return rec;
  },

  /** Seed bundled plans; refresh those the user never edited when the bundle changes. */
  async seedBundled(bundled: { plan: Plan; hash: string }[]): Promise<void> {
    const now = Date.now();
    await db().transaction("rw", db().plans, async () => {
      for (const { plan, hash } of bundled) {
        const existing = await db().plans.get(plan.id);
        if (!existing) {
          await db().plans.add({
            id: plan.id,
            name: plan.name,
            doc: plan,
            origin: "bundled",
            bundledHash: hash,
            userEdited: false,
            createdAt: now,
            updatedAt: now,
          });
        } else if (!existing.userEdited && existing.bundledHash !== hash) {
          await db().plans.update(plan.id, { doc: plan, name: plan.name, bundledHash: hash, updatedAt: now });
        }
      }
    });
  },

  archive: (id: string) => db().plans.update(id, { archivedAt: Date.now() }),
  remove: (id: string) => db().plans.delete(id),

  async getActiveId(): Promise<string | undefined> {
    const s = await db().settings.get(ACTIVE_PLAN_KEY);
    return s?.value as string | undefined;
  },
  setActiveId: (id: string) => db().settings.put({ key: ACTIVE_PLAN_KEY, value: id }),
};

export { newId };
