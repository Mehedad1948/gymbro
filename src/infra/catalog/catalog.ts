import type { Catalog, CatalogExercise } from "@/domain/exercise/types";

const CATALOG_URL = "/data/exercises.json";

let promise: Promise<Catalog> | undefined;
let byId: Map<string, CatalogExercise> | undefined;

/** Load once per page lifetime; the service worker keeps it offline. */
export function loadCatalog(): Promise<Catalog> {
  if (!promise) {
    promise = fetch(CATALOG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`catalog ${r.status}`);
        return r.json() as Promise<Catalog>;
      })
      .then((c) => {
        byId = new Map(c.exercises.map((e) => [e.id, e]));
        return c;
      })
      .catch((e) => {
        promise = undefined;
        throw e;
      });
  }
  return promise;
}

export function getCatalogSync(): Map<string, CatalogExercise> | undefined {
  return byId;
}

export type CatalogFilters = { q?: string; bodyPart?: string; equipment?: string; target?: string };

export function searchCatalog(c: Catalog, f: CatalogFilters, limit = 60): CatalogExercise[] {
  const q = f.q?.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  const out: CatalogExercise[] = [];
  for (const e of c.exercises) {
    if (f.bodyPart && e.bodyPart !== f.bodyPart) continue;
    if (f.equipment && e.equipment !== f.equipment) continue;
    if (f.target && e.target !== f.target) continue;
    if (terms.length) {
      const hay = `${e.name} ${e.target} ${e.equipment} ${e.secondaryMuscles.join(" ")}`;
      if (!terms.every((t) => hay.includes(t))) continue;
    }
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

export function distinct(c: Catalog, key: "bodyPart" | "equipment" | "target"): string[] {
  return [...new Set(c.exercises.map((e) => e[key]))].sort();
}
