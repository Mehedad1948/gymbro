import type { CatalogExercise } from "@/domain/exercise/types";

/**
 * Media stays out of the bundle (≈125 MB of GIFs). It is fetched on demand
 * from the dataset repo and cached by the service worker (see public/sw.js).
 * Override with NEXT_PUBLIC_EXERCISE_MEDIA_BASE to self-host a mirror.
 *
 * Media is © Gym visual — https://gymvisual.com/ ; keep the attribution.
 */
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_EXERCISE_MEDIA_BASE ??
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export const MEDIA_ATTRIBUTION = "© Gym visual — https://gymvisual.com/";

export function gifUrl(e: Pick<CatalogExercise, "id" | "mediaId">): string {
  return `${MEDIA_BASE}/videos/${e.id}-${e.mediaId}.gif`;
}

export function thumbUrl(e: Pick<CatalogExercise, "id" | "mediaId">): string {
  return `${MEDIA_BASE}/images/${e.id}-${e.mediaId}.jpg`;
}
