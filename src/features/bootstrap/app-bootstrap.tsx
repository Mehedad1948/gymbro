"use client";

import { useEffect } from "react";
import { bundledPlans, DEFAULT_PLAN_ID } from "@/content/plans";
import { plansRepo } from "@/infra/db/plans-repo";

/**
 * Runs once per page load on the client: seeds bundled plans into IndexedDB
 * and picks a default active plan. Idempotent and cheap.
 */
export function AppBootstrap() {
  useEffect(() => {
    (async () => {
      try {
        await plansRepo.seedBundled(bundledPlans);
        if (!(await plansRepo.getActiveId())) await plansRepo.setActiveId(DEFAULT_PLAN_ID);
        try {
          document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") ?? "");
        } catch {
          /* storage unavailable */
        }
      } catch (e) {
        console.error("bootstrap failed", e);
      }
    })();
  }, []);
  return null;
}
