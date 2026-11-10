/** Slim catalog record produced by scripts/build-exercise-catalog.mjs */
export type CatalogExercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles: string[];
  mediaId: string;
  steps: string[];
};

export type Catalog = {
  version: number;
  lang: string;
  source: string;
  attribution: string;
  builtAt: string;
  count: number;
  exercises: CatalogExercise[];
};
