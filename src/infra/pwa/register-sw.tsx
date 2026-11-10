"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js in production builds only, so dev never serves
 * stale cached bundles. The worker is plain JS with no build step.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      /* offline support is progressive; ignore registration failures */
    });
    // Workout logs live only on this device: ask the browser not to evict them under storage pressure.
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);
  return null;
}
