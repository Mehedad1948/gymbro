"use client";

import { useEffect, useRef, useState } from "react";
import { chime, unlockAudio } from "@/shared/lib/beep";
import { cn } from "@/shared/lib/format";
import { clearRestNotification, requestRestNotifications, showRestDone, showRestRunning } from "@/infra/pwa/rest-notification";

const DEFAULT_SEC = 90;

function clock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * Floating rest timer, bottom right. Ticking a set arms it with that
 * exercise's rest; a tap starts the countdown; at zero it chimes and vibrates.
 * Time is computed from an end timestamp, so it stays right if the tab sleeps.
 * While running it is mirrored as a system notification (see rest-notification).
 */
export function RestTimerFab({ armedSec }: { armedSec?: number }) {
  const total = armedSec ?? DEFAULT_SEC;
  const [run, setRun] = useState<{ endAt: number; total: number } | null>(null);
  const [left, setLeft] = useState(total);
  const [finished, setFinished] = useState(false);
  const [menu, setMenu] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (!run) return;
    fired.current = false;
    const remaining = () => Math.max(0, Math.ceil((run.endAt - Date.now()) / 1000));
    // Notification text can't tick by itself: refresh it quietly while the app is hidden.
    let notifiedAt = Date.now();
    void showRestRunning(remaining(), run.endAt);
    const onHide = () => {
      if (!document.hidden || fired.current) return;
      notifiedAt = Date.now();
      void showRestRunning(remaining(), run.endAt);
    };
    document.addEventListener("visibilitychange", onHide);
    const tick = () => {
      const l = remaining();
      setLeft(l);
      if (l > 0 && document.hidden && Date.now() - notifiedAt >= 5000) {
        notifiedAt = Date.now();
        void showRestRunning(l, run.endAt);
      }
      if (l === 0 && !fired.current) {
        fired.current = true;
        if (document.hidden) void showRestDone();
        else void clearRestNotification();
        chime();
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* unsupported */
        }
        setRun(null);
        setMenu(false);
        setFinished(true);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [run]);

  // Leaving the workout drops the timer, so drop its notification too.
  useEffect(() => () => void clearRestNotification(), []);

  // "برو!" stays a few seconds, then the button goes back to ready.
  useEffect(() => {
    if (!finished) return;
    const id = setTimeout(() => setFinished(false), 5000);
    return () => clearTimeout(id);
  }, [finished]);

  function start() {
    unlockAudio();
    requestRestNotifications();
    setFinished(false);
    setRun({ endAt: Date.now() + total * 1000, total });
  }

  const running = run !== null;
  const shown = running ? left : total;
  const pct = running ? Math.round((left / run.total) * 100) : 100;

  return (
    // dir="ltr" so "end" is the physical right in this RTL app: the button stays in the corner.
    <div dir="ltr" className="fixed z-30 flex flex-col items-end gap-2" style={{ right: "1rem", bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      {menu && running && (
        <div dir="rtl" className="flex gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg">
          <button
            className="h-11 rounded-xl bg-surface-2 px-3 text-sm font-medium"
            onClick={() => setRun((r) => r && { endAt: r.endAt + 30_000, total: r.total + 30 })}
          >
            ۳۰+ ثانیه
          </button>
          <button
            className="h-11 rounded-xl bg-danger/15 px-3 text-sm font-medium text-danger"
            onClick={() => {
              setRun(null);
              setMenu(false);
              void clearRestNotification();
            }}
          >
            توقف
          </button>
        </div>
      )}
      <button
        onClick={() => (running ? setMenu((m) => !m) : start())}
        aria-label={running ? `استراحت: ${clock(left)} مانده. برای گزینه‌ها بزن` : finished ? "استراحت تمام شد" : `شروع تایمر استراحت ${clock(total)}`}
        aria-expanded={running ? menu : undefined}
        className={cn(
          "relative grid size-16 place-items-center rounded-full border shadow-lg transition active:scale-95",
          finished ? "animate-pulse border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground",
        )}
      >
        <svg viewBox="0 0 36 36" className="absolute inset-0 size-16 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="16.5" fill="none" stroke="var(--border)" strokeWidth="2" />
          {running && <circle cx="18" cy="18" r="16.5" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${pct} 100`} pathLength={100} />}
        </svg>
        <span className="relative flex flex-col items-center leading-none">
          {finished ? (
            <span className="text-sm font-bold">برو!</span>
          ) : (
            <>
              {!running && (
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="mb-1 text-accent">
                  <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 9v4l2.5 2M9.5 2.5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              <span dir="ltr" className={cn("font-mono tabular-nums", running ? "text-base font-semibold" : "text-xs")}>
                {clock(shown)}
              </span>
            </>
          )}
        </span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {finished ? "استراحت تمام شد" : ""}
      </span>
    </div>
  );
}
