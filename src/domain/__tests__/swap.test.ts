import { describe, expect, it } from "vitest";
import { applySwap, resolveSwap, swapOptions } from "../workout/swap";
import { exerciseKeyOf } from "../workout/types";
import type { PlanExercise } from "../plan/schema";

const hack: PlanExercise = {
  key: "hack-squat",
  name: "Hack squat (sled)",
  nameFa: "هک اسکوات",
  exerciseId: "0743",
  alternatives: ["0755", "1760", "0755"],
  sets: 4,
  reps: [6, 8],
  rir: 2,
  restSec: 180,
  startLoadKg: 60,
  cue: "Heels down",
  progression: { type: "double", incrementKg: 5 },
};

describe("exercise swaps", () => {
  it("lists the prescribed id first, without duplicates", () => {
    expect(swapOptions(hack)).toEqual(["0743", "0755", "1760"]);
    expect(swapOptions({ ...hack, exerciseId: undefined })).toEqual([]);
  });

  it("ignores choices that are not alternatives", () => {
    expect(resolveSwap(hack, "1760")).toBe("1760");
    expect(resolveSwap(hack, "9999")).toBe("0743");
    expect(resolveSwap(hack, undefined)).toBe("0743");
  });

  it("keeps the prescription but moves history to the alternative", () => {
    const alt = applySwap(hack, { id: "1760", name: "Dumbbell Goblet Squat", equipment: "dumbbell" });
    expect(exerciseKeyOf(alt)).toBe("1760");
    expect(alt).toMatchObject({ key: "hack-squat", sets: 4, reps: [6, 8], rir: 2, restSec: 180, equipment: "dumbbell" });
    expect(alt.startLoadKg).toBeUndefined();
    expect(alt.cue).toBeUndefined();
    expect(alt.nameFa).toBeUndefined();
  });

  it("returns the original when nothing is swapped", () => {
    expect(applySwap(hack, undefined)).toBe(hack);
    expect(applySwap(hack, { id: "0743", name: "x" })).toBe(hack);
  });
});
