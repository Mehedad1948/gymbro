import { parsePlan, type Plan } from "@/domain/plan";
import { hashString } from "@/shared/lib/ids";
import plan1 from "./plan-1-full-body-2025-10.json";
import plan2 from "./plan-2-three-day-split-2025-11.json";
import plan3 from "./plan-3-four-day-split-2026-01.json";
import plan4 from "./plan-4-upper-lower-2026-11.json";

/**
 * Plans that ship with the app. They are validated at module load so a
 * malformed JSON fails loudly in dev/tests instead of silently at seed time.
 * Order matters: the first entry becomes the default active plan.
 */
const raw: unknown[] = [plan4, plan3, plan2, plan1];

export const bundledPlans: { plan: Plan; hash: string }[] = raw.map((doc) => {
  const res = parsePlan(doc);
  if (!res.ok) throw new Error(`Bundled plan invalid:\n${res.errors.join("\n")}`);
  return { plan: res.plan, hash: hashString(JSON.stringify(doc)) };
});

export const DEFAULT_PLAN_ID = bundledPlans[0].plan.id;
