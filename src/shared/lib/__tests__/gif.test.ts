import { describe, expect, it } from "vitest";
import { decodeGif } from "../gif";

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

describe("decodeGif", () => {
  it("decodes a 1×1 single-frame GIF", () => {
    // Classic 1×1 white pixel.
    const g = decodeGif(b64("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs="));
    expect(g.width).toBe(1);
    expect(g.height).toBe(1);
    expect(g.frames).toHaveLength(1);
    expect([...g.frames[0].pixels]).toEqual([255, 255, 255, 255]);
    expect(g.frames[0].delayMs).toBe(100);
  });

  it("honours the transparent index", () => {
    // 1×1 transparent pixel (GCE with transparency flag).
    const g = decodeGif(b64("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"));
    expect(g.frames[0].pixels[3]).toBe(0);
  });

  it("rejects non-GIF data", () => {
    expect(() => decodeGif(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow();
  });
});
