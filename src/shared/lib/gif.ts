/*
 * Minimal GIF decoder (GIF87a/89a): LZW, global/local palettes, transparency,
 * interlacing and frame disposal. Returns fully composited RGBA frames so a
 * player can draw them on a canvas. Exists because some mobile browsers show
 * animated GIFs as a still frame (e.g. iOS "Auto-Play Animated Images" off);
 * drawing frames ourselves makes playback, pause and slow motion explicit.
 */

export type GifFrame = { pixels: Uint8ClampedArray; delayMs: number };
export type DecodedGif = { width: number; height: number; frames: GifFrame[] };

/** Browsers clamp tiny delays (0–1 cs) to ~100 ms; match that. */
const MIN_DELAY_MS = 20;
const DEFAULT_DELAY_MS = 100;

export function decodeGif(input: ArrayBuffer | Uint8Array): DecodedGif {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const sig = String.fromCharCode(...b.subarray(0, 6));
  if (sig !== "GIF89a" && sig !== "GIF87a") throw new Error("not a GIF");

  const width = b[6] | (b[7] << 8);
  const height = b[8] | (b[9] << 8);
  const flags = b[10];
  let p = 13;
  let globalPalette: Uint8Array | undefined;
  if (flags & 0x80) {
    const size = 3 * (1 << ((flags & 7) + 1));
    globalPalette = b.subarray(p, p + size);
    p += size;
  }

  const canvas = new Uint8ClampedArray(width * height * 4);
  const frames: GifFrame[] = [];
  let delayMs = 0;
  let disposal = 0;
  let transparent = -1;
  let pending: { x: number; y: number; w: number; h: number; disposal: number; snapshot?: Uint8ClampedArray } | undefined;

  const skipSubBlocks = () => {
    while (p < b.length && b[p] !== 0) p += b[p] + 1;
    p++;
  };

  while (p < b.length) {
    const block = b[p++];
    if (block === 0x3b) break; // trailer
    if (block === 0x21) {
      const label = b[p++];
      if (label === 0xf9) {
        const gceFlags = b[p + 1];
        delayMs = (b[p + 2] | (b[p + 3] << 8)) * 10;
        transparent = gceFlags & 1 ? b[p + 4] : -1;
        disposal = (gceFlags >> 2) & 7;
        p += b[p] + 1;
      }
      skipSubBlocks();
      continue;
    }
    if (block !== 0x2c) break; // unknown block: stop with what we have

    const x = b[p] | (b[p + 1] << 8);
    const y = b[p + 2] | (b[p + 3] << 8);
    const w = b[p + 4] | (b[p + 5] << 8);
    const h = b[p + 6] | (b[p + 7] << 8);
    const imgFlags = b[p + 8];
    p += 9;
    let palette = globalPalette;
    if (imgFlags & 0x80) {
      const size = 3 * (1 << ((imgFlags & 7) + 1));
      palette = b.subarray(p, p + size);
      p += size;
    }
    const minCodeSize = b[p++];
    const start = p;
    let total = 0;
    while (p < b.length && b[p] !== 0) {
      total += b[p];
      p += b[p] + 1;
    }
    p++;
    const data = new Uint8Array(total);
    for (let q = start, o = 0; o < total; ) {
      const n = b[q];
      data.set(b.subarray(q + 1, q + 1 + n), o);
      o += n;
      q += n + 1;
    }

    // Undo the previous frame according to its disposal method.
    if (pending?.disposal === 2) clearRect(canvas, width, height, pending);
    else if (pending?.disposal === 3 && pending.snapshot) canvas.set(pending.snapshot);
    const snapshot = disposal === 3 ? canvas.slice() : undefined;

    const indices = lzw(minCodeSize, data, w * h);
    const rows = imgFlags & 0x40 ? interlacedRows(h) : undefined;
    if (palette) {
      for (let i = 0; i < w * h; i++) {
        const ci = indices[i];
        if (ci === transparent) continue;
        const row = rows ? rows[Math.floor(i / w)] : Math.floor(i / w);
        const px = x + (i % w);
        const py = y + row;
        if (px >= width || py >= height) continue;
        const d = (py * width + px) * 4;
        canvas[d] = palette[ci * 3];
        canvas[d + 1] = palette[ci * 3 + 1];
        canvas[d + 2] = palette[ci * 3 + 2];
        canvas[d + 3] = 255;
      }
    }

    frames.push({ pixels: canvas.slice(), delayMs: delayMs < MIN_DELAY_MS ? DEFAULT_DELAY_MS : delayMs });
    pending = { x, y, w, h, disposal, snapshot };
    delayMs = 0;
    disposal = 0;
    transparent = -1;
  }

  if (frames.length === 0) throw new Error("GIF has no frames");
  return { width, height, frames };
}

function clearRect(canvas: Uint8ClampedArray, width: number, height: number, r: { x: number; y: number; w: number; h: number }) {
  for (let row = r.y; row < Math.min(height, r.y + r.h); row++) {
    canvas.fill(0, (row * width + r.x) * 4, (row * width + Math.min(width, r.x + r.w)) * 4);
  }
}

/** Interlaced images store rows in four passes; map stored row → real row. */
function interlacedRows(h: number): number[] {
  const rows: number[] = [];
  for (const [startRow, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = startRow; r < h; r += step) rows.push(r);
  return rows;
}

function lzw(minCodeSize: number, data: Uint8Array, pixelCount: number): Uint8Array {
  const out = new Uint8Array(pixelCount);
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) suffix[i] = i;

  let codeSize = minCodeSize + 1;
  let codeMask = (1 << codeSize) - 1;
  let next = eoi + 1;
  let old = -1;
  let firstChar = 0;
  let datum = 0;
  let bits = 0;
  let di = 0;
  let op = 0;

  while (op < pixelCount) {
    while (bits < codeSize) {
      if (di >= data.length) return out;
      datum |= data[di++] << bits;
      bits += 8;
    }
    let code = datum & codeMask;
    datum >>>= codeSize;
    bits -= codeSize;

    if (code === clear) {
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
      next = eoi + 1;
      old = -1;
      continue;
    }
    if (code === eoi) break;
    if (old === -1) {
      out[op++] = suffix[code];
      old = code;
      firstChar = code;
      continue;
    }

    const inCode = code;
    let sp = 0;
    if (code >= next) {
      stack[sp++] = firstChar;
      code = old;
    }
    while (code > eoi) {
      stack[sp++] = suffix[code];
      code = prefix[code];
    }
    firstChar = suffix[code];
    stack[sp++] = firstChar;

    if (next < 4096) {
      prefix[next] = old;
      suffix[next] = firstChar;
      next++;
      if ((next & codeMask) === 0 && codeSize < 12) {
        codeSize++;
        codeMask = (1 << codeSize) - 1;
      }
    }
    old = inCode;
    while (sp > 0 && op < pixelCount) out[op++] = stack[--sp];
  }
  return out;
}
