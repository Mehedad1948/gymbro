import { describe, expect, it } from "vitest";
import { cycleProgress } from "../workout/cycle";

const ids = ["a", "b", "c"];
const w = (sessionId: string, startedAt: number) => ({ sessionId, startedAt, finishedAt: startedAt + 1 });

describe("cycleProgress", () => {
  it("starts with nothing done and the first session next", () => {
    const p = cycleProgress(ids, []);
    expect([...p.done]).toEqual([]);
    expect(p.last).toBeUndefined();
    expect(p.nextId).toBe("a");
  });

  it("checks finished sessions and points at the first missing one", () => {
    const p = cycleProgress(ids, [w("a", 1), w("c", 2)]);
    expect([...p.done].sort()).toEqual(["a", "c"]);
    expect(p.last).toEqual({ sessionId: "c", at: 3 });
    expect(p.nextId).toBe("b");
  });

  it("keeps a full cycle checked until the next workout opens a new one", () => {
    const full = cycleProgress(ids, [w("a", 1), w("b", 2), w("c", 3)]);
    expect(full.done.size).toBe(3);
    expect(full.nextId).toBe("a");

    const next = cycleProgress(ids, [w("a", 1), w("b", 2), w("c", 3), w("a", 4)]);
    expect([...next.done]).toEqual(["a"]);
    expect(next.nextId).toBe("b");
  });

  it("ignores non-training sessions", () => {
    const p = cycleProgress(ids, [w("a", 2), w("corrective", 5)]);
    expect([...p.done]).toEqual(["a"]);
    expect(p.last?.sessionId).toBe("a");
  });

  it("does not depend on input order", () => {
    const p = cycleProgress(ids, [w("b", 2), w("a", 1)]);
    expect(p.last?.sessionId).toBe("b");
    expect(p.nextId).toBe("c");
  });
});
