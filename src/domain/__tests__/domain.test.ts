import { describe, expect, it } from "vitest";
import { suggestNext } from "../progression/suggest";
import { expandSets, formatReps } from "../plan/sets";
import { parsePlan } from "../plan/parse";
import type { PlanExercise } from "../plan/schema";
import type { SetLog } from "../workout/types";

const bench: PlanExercise = {
  key: "bench",
  name: "Barbell bench press",
  exerciseId: "0025",
  sets: 3,
  reps: [6, 8],
  rir: 2,
  progression: { type: "double", incrementKg: 2.5 },
};

function log(i: number, weightKg: number, reps: number, rir = 2): SetLog {
  return {
    id: `s${i}`,
    workoutId: "w",
    planId: "p",
    sessionId: "u",
    exerciseKey: "0025",
    exerciseName: "bench",
    setIndex: i,
    weightKg,
    reps,
    rir,
    done: true,
    completedAt: i,
  };
}

describe("suggestNext (double progression)", () => {
  it("has no suggestion without history", () => {
    expect(suggestNext(bench, []).direction).toBe("none");
  });
  it("adds load when all sets hit the top of the range", () => {
    const s = suggestNext(bench, [log(0, 60, 8), log(1, 60, 8), log(2, 60, 8)]);
    expect(s).toMatchObject({ weightKg: 62.5, direction: "up" });
  });
  it("holds load when a set misses the top", () => {
    const s = suggestNext(bench, [log(0, 60, 8), log(1, 60, 7), log(2, 60, 6)]);
    expect(s).toMatchObject({ weightKg: 60, direction: "hold" });
  });
  it("holds load when RIR was above target", () => {
    const s = suggestNext(bench, [log(0, 60, 8, 4), log(1, 60, 8, 3), log(2, 60, 8, 2)]);
    expect(s.direction).toBe("hold");
  });
});

describe("expandSets", () => {
  it("expands a ladder per set", () => {
    const sets = expandSets({ ...bench, sets: 4, reps: [12, 10, 8, 8] });
    expect(sets.map((s) => s.reps)).toEqual([12, 10, 8, 8]);
  });
  it("treats an ascending pair as a range", () => {
    expect(expandSets(bench)[0].repRange).toEqual([6, 8]);
    expect(formatReps(bench)).toBe("3 × 6–8");
  });
});

describe("parsePlan", () => {
  const session = (id: string) => ({
    id,
    name: "A",
    blocks: [{ exercises: [{ key: "k", name: "n", sets: 1, reps: 1 }] }],
  });
  const meta = { author: "a", source: "self", createdAt: "2026-01-01" };

  it("accepts a minimal plan and applies defaults", () => {
    const res = parsePlan({ schemaVersion: 1, id: "x", name: "x", meta, sessions: [session("a")] });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.plan.sessions[0].blocks[0].type).toBe("straight");
  });
  it("rejects duplicate session ids", () => {
    const res = parsePlan({ schemaVersion: 1, id: "x", name: "x", meta, sessions: [session("a"), session("a")] });
    expect(res.ok).toBe(false);
  });
  it("rejects invalid JSON text", () => {
    expect(parsePlan("{nope").ok).toBe(false);
  });
});
