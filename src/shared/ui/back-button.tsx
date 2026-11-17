"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Goes back like the browser does; falls back to `fallback` when there is no
 * history to return to (link opened directly, PWA launched on this page).
 */
export function BackButton({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      {children}
    </button>
  );
}
