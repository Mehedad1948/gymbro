"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/infra/db/database";
import { ACTIVE_PLAN_KEY } from "@/infra/db/plans-repo";

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
