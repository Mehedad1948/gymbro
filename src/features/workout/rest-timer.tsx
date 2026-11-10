"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui";

/** Count-down shown after a set is logged. Vibrates when done (if supported). */
export function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const endAt = useRef(0);

  useEffect(() => {
    endAt.current = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* unsupported */
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);

  const pct = Math.round((left / seconds) * 100);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <div className="relative size-14 shrink-0">
          <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${pct} 100`} pathLength={100} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm">{left}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{left === 0 ? "Go!" : "Rest"}</p>
          <p className="text-xs text-muted">{seconds}s prescribed</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { endAt.current += 30_000; setLeft((l) => l + 30); }}>
          +30s
        </Button>
        <Button size="sm" onClick={onDone}>
          Skip
        </Button>
      </div>
    </div>
  );
}
