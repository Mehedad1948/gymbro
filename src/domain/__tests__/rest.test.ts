import { describe, expect, it } from "vitest";
import { restAfterSet } from "../workout/rest";

const ex = (key: string, sets = 3, restSec?: number) => ({ key, name: key, sets, reps: 10, restSec });
const none = () => false;

describe("restAfterSet", () => {
  it("rests after every set of a straight block", () => {
    const block = { type: "straight" as const, restSec: 90, exercises: [ex("a", 3, 120)] };
    expect(restAfterSet(block, "a", 0, none)).toEqual({ sec: 120 });
    expect(restAfterSet({ ...block, exercises: [ex("a")] }, "a", 1, none)).toEqual({ sec: 90 });
  });

  it("waits for the whole round in a superset", () => {
    const block = { type: "superset" as const, restSec: 75, exercises: [ex("a"), ex("b")] };
    expect(restAfterSet(block, "a", 0, none)).toBeNull();
    const done = new Set(["a:0"]);
    expect(restAfterSet(block, "b", 0, (k, i) => done.has(`${k}:${i}`))).toEqual({ sec: 75 });
    // Out of order: b first, then a closes the round.
    expect(restAfterSet(block, "a", 1, (k, i) => k === "b" && i === 1)).toEqual({ sec: 75 });
  });

  it("treats an exercise with fewer sets as done for extra rounds", () => {
    const block = { type: "compound" as const, exercises: [ex("a", 4, 60), ex("b", 3)] };
    expect(restAfterSet(block, "a", 3, none)).toEqual({ sec: 60 });
  });

  it("returns null for an unknown exercise", () => {
    expect(restAfterSet({ type: "straight", exercises: [ex("a")] }, "x", 0, none)).toBeNull();
  });
});
