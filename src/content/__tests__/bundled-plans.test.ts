import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { bundledPlans } from "../plans";

const catalog = JSON.parse(readFileSync("public/data/exercises.json", "utf8")) as {
  exercises: { id: string }[];
};
const ids = new Set(catalog.exercises.map((e) => e.id));

describe("bundled plans", () => {
  it("validate against the schema", () => {
    expect(bundledPlans.length).toBeGreaterThan(0);
  });

  it("reference only catalog ids that exist", () => {
    const missing: string[] = [];
    for (const { plan } of bundledPlans)
      for (const s of plan.sessions)
        for (const b of s.blocks)
          for (const e of b.exercises) {
            if (e.exerciseId && !ids.has(e.exerciseId)) missing.push(`${plan.id}/${s.id}/${e.key}:${e.exerciseId}`);
            for (const a of e.alternatives ?? []) if (!ids.has(a)) missing.push(`${plan.id}/${s.id}/${e.key} alt:${a}`);
          }
    expect(missing).toEqual([]);
  });
});
