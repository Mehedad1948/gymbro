#!/usr/bin/env node
/**
 * Rasterises public/logo.svg into the PWA icons and the favicon:
 *   public/icons/icon-192.png, icon-512.png   logo on the app background
 *   public/icons/icon-maskable-512.png        logo shrunk into the maskable safe zone
 *   src/app/favicon.ico                       16/32/48 px, PNG-in-ICO
 *
 * Uses sharp, which Next.js already installs for image optimisation; nothing
 * extra goes into package.json. Re-run after editing the logo.
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("sharp not found (it ships with next). Run `npm install` and retry.");
  process.exit(1);
}

const BG = "#0b0f14";
const logo = readFileSync("public/logo.svg");

/** Logo centred on a square of `bg` (or transparent), occupying `fill` of the side. */
async function render(size, fill, bg) {
  const inner = Math.round(size * fill);
  const mark = await sharp(logo, { density: 72 * Math.max(1, inner / 162) })
    .resize(inner, inner)
    .png()
    .toBuffer();
  const canvas = bg
    ? { r: parseInt(bg.slice(1, 3), 16), g: parseInt(bg.slice(3, 5), 16), b: parseInt(bg.slice(5, 7), 16), alpha: 1 }
    : { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp({ create: { width: size, height: size, channels: 4, background: canvas } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header[e] = size >= 256 ? 0 : size;
    header[e + 1] = size >= 256 ? 0 : size;
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

mkdirSync("public/icons", { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, await render(s, 0.92, BG));
// Maskable icons may be cropped to a circle of 80% diameter; keep the badge inside it.
writeFileSync("public/icons/icon-maskable-512.png", await render(512, 0.76, BG));

// Favicon: the badge's own dark disc carries it, so the corners stay transparent.
const disc = Buffer.from(
  logo
    .toString("utf8")
    .replace(/(<svg[^>]*>)/, `$1<circle cx="80.721" cy="80.723" r="80.6" fill="${BG}"/>`),
);
const favicon = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, png: await sharp(disc, { density: 300 }).resize(size, size).png().toBuffer() })),
);
writeFileSync("src/app/favicon.ico", ico(favicon));

console.log("icons written to public/icons/ and src/app/favicon.ico");
