import type { MetadataRoute } from "next";
import { NOINDEX } from "./site";

export default function robots(): MetadataRoute.Robots {
  // Pre-release: keep every crawler out. Flip NEXT_PUBLIC_ALLOW_INDEXING=true to open up.
  return {
    rules: NOINDEX ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/" },
  };
}
