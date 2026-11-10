#!/usr/bin/env node
/**
 * Generates public/icons/icon-192.png and icon-512.png without any image
 * library: a rounded dark tile with a lime dumbbell, drawn pixel by pixel and
 * encoded as PNG with zlib. Replace with real artwork whenever you like.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x0b, 0x0f, 0x14];
const FG = [0xb6, 0xf0, 0x4c];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const r = size * 0.22; // corner radius
  const inRounded = (x, y) => {
    const cx = Math.min(Math.max(x, r), size - r), cy = Math.min(Math.max(y, r), size - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  // dumbbell geometry in unit coordinates
  const bar = { x0: 0.22, x1: 0.78, y0: 0.465, y1: 0.535 };
  const plates = [
    { x0: 0.15, x1: 0.24, y0: 0.30, y1: 0.70 },
    { x0: 0.24, x1: 0.31, y0: 0.36, y1: 0.64 },
    { x0: 0.69, x1: 0.76, y0: 0.36, y1: 0.64 },
    { x0: 0.76, x1: 0.85, y0: 0.30, y1: 0.70 },
  ];
  const inRect = (u, v, q) => u >= q.x0 && u <= q.x1 && v >= q.y0 && v <= q.y1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    if (!inRounded(x + 0.5, y + 0.5)) { px[i + 3] = 0; continue; }
    const u = (x + 0.5) / size, v = (y + 0.5) / size;
    const on = inRect(u, v, bar) || plates.some((p) => inRect(u, v, p));
    const [R, G, B] = on ? FG : BG;
    px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = 255;
  }
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, render(s));
console.log("icons written to public/icons/");
