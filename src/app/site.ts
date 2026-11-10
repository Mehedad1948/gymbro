/**
 * Public site settings shared by metadata, the OG image and robots.
 * Set NEXT_PUBLIC_SITE_URL on the host (e.g. Vercel) so absolute URLs in
 * Open Graph tags point at the real deployment.
 */
export const SITE_NAME = "Gymbro";
export const SITE_TAGLINE_FA = "برنامه‌های تمرینی، ثبت ست‌ها و راهنمای حرکات. آفلاین، روی گوشی شما.";
export const SITE_TAGLINE_EN = "Training plans, set logging and movement guides. Offline, on your phone.";

/** True while the app is private/pre-release: blocks indexing everywhere. */
export const NOINDEX = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true";

export function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!raw) return new URL("http://localhost:3000");
  return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
}
