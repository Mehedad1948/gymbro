import { describe, expect, it } from "vitest";
import { parseTempo } from "../plan/tempo";

describe("parseTempo", () => {
  it("reads eccentric-pause-concentric", () => {
    expect(parseTempo("3-1-1")).toEqual({ eccentric: 3, pause: 1, concentric: 1 });
  });

  it("reads the optional top pause", () => {
    expect(parseTempo("3-0-1-2")).toEqual({ eccentric: 3, pause: 0, concentric: 1, top: 2 });
  });

  it("rejects anything else", () => {
    expect(parseTempo("3/1/1")).toBeUndefined();
    expect(parseTempo("31-1-1")).toBeUndefined();
  });
});
