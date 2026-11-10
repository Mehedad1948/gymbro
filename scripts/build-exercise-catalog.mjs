#!/usr/bin/env node
/**
 * Build the on-device exercise catalog from hasaneyldrm/exercises-dataset.
 *
 * Usage:
 *   node scripts/build-exercise-catalog.mjs [path/to/exercises.json]
 *
 * Without an argument the script downloads the dataset from GitHub.
 * Output: public/data/exercises.json (English-only, slim, ~1 MB) that the app
 * loads lazily and the service worker caches for offline use.
 *
 * Media (thumbnails / GIFs) is NOT copied: the app references it by URL
 * (see src/infra/catalog/media.ts) and caches it on demand. Media is
 * © Gym visual — https://gymvisual.com/ and must keep that attribution.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const OUT = path.resolve("public/data/exercises.json");
const LANG = process.env.CATALOG_LANG ?? "en";

async function load(arg) {
  if (arg) return JSON.parse(await readFile(arg, "utf8"));
  console.log(`Downloading ${SOURCE_URL} …`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.json();
}

const raw = await load(process.argv[2]);
if (!Array.isArray(raw)) throw new Error("Dataset is not an array");

const slim = raw.map((e) => ({
  id: e.id,
  name: e.name,
  bodyPart: e.body_part,
  target: e.target,
  equipment: e.equipment,
  secondaryMuscles: e.secondary_muscles ?? [],
  mediaId: e.media_id,
  steps: e.instruction_steps?.[LANG] ?? [],
}));

slim.sort((a, b) => a.id.localeCompare(b.id));

const catalog = {
  version: 1,
  lang: LANG,
  source: "https://github.com/hasaneyldrm/exercises-dataset",
  attribution: "© Gym visual — https://gymvisual.com/",
  builtAt: new Date().toISOString(),
  count: slim.length,
  exercises: slim,
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(catalog));
const kb = Math.round(Buffer.byteLength(JSON.stringify(catalog)) / 1024);
console.log(`Wrote ${slim.length} exercises → ${path.relative(process.cwd(), OUT)} (${kb} KB)`);

// Print distinct equipment / targets for docs
const uniq = (k) => [...new Set(slim.map((e) => e[k]))].sort();
console.log("equipment:", uniq("equipment").join(", "));
console.log("bodyParts:", uniq("bodyPart").join(", "));
console.log("targets:", uniq("target").join(", "));
