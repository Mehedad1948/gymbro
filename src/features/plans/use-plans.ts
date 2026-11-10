"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/infra/db/database";
import { ACTIVE_PLAN_KEY } from "@/infra/db/plans-repo";
import type { Plan } from "@/domain/plan";
import { cycleProgress, type CycleProgress } from "@/domain/workout/cycle";
import type { Workout } from "@/domain/workout/types";

/** Reactive queries. `undefined` = still loading. */
export function usePlans() {
  return useLiveQuery(() => db().plans.filter((p) => !p.archivedAt).sortBy("updatedAt"), []);
}

export function usePlan(id: string | undefined) {
  return useLiveQuery(() => (id ? db().plans.get(id) : undefined), [id]);
}

export function useActivePlanId() {
  return useLiveQuery(async () => (await db().settings.get(ACTIVE_PLAN_KEY))?.value as string | undefined, []);
}

export function useActivePlan() {
  const id = useActivePlanId();
  return usePlan(id);
}

export type PlanProgress = CycleProgress & { active?: Workout };

/** Check marks, last finished and next training session, plus the open workout. */
export function usePlanProgress(plan: Plan | undefined): PlanProgress | undefined {
  const trainingIds = plan?.sessions.filter((s) => s.kind === "training").map((s) => s.id) ?? [];
  const key = trainingIds.join(",");
  return useLiveQuery(async () => {
    if (!plan) return undefined;
    const ws = await db().workouts.where("planId").equals(plan.id).toArray();
    return {
      ...cycleProgress(trainingIds, ws.filter((w) => w.status === "done")),
      active: ws.find((w) => w.status === "active"),
    };
  }, [plan?.id, key]);
}
