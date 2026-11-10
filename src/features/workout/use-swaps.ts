"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/infra/db/database";
import { planSwapsKey, type SwapMap } from "@/infra/db/swaps-repo";

const EMPTY: SwapMap = {};

/** Plan-wide alternative choices ("my gym has no hack squat"). */
export function usePlanSwapDefaults(planId: string | undefined): SwapMap {
  const map = useLiveQuery(
    async () => (planId ? (((await db().settings.get(planSwapsKey(planId)))?.value ?? EMPTY) as SwapMap) : EMPTY),
    [planId],
  );
  return map ?? EMPTY;
}
