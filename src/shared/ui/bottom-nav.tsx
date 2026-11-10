"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardListIcon as PlansActive,
  DumbbellLargeMinimalisticIcon as GuideActive,
  HistoryIcon as HistoryActive,
  HomeAngle2Icon as TodayActive,
  Widget5Icon as MoreActive,
} from "@solar-icons/react/bold-duotone";
import {
  ClipboardListIcon as PlansIdle,
  DumbbellLargeMinimalisticIcon as GuideIdle,
  HistoryIcon as HistoryIdle,
  HomeAngle2Icon as TodayIdle,
  Widget5Icon as MoreIdle,
} from "@solar-icons/react/linear";
import { cn } from "@/shared/lib/format";

const tabs = [
  { href: "/", label: "امروز", Idle: TodayIdle, Active: TodayActive },
  { href: "/plans", label: "برنامه‌ها", Idle: PlansIdle, Active: PlansActive },
  { href: "/exercises", label: "راهنما", Idle: GuideIdle, Active: GuideActive },
  { href: "/history", label: "تاریخچه", Idle: HistoryIdle, Active: HistoryActive },
  { href: "/settings", label: "بیشتر", Idle: MoreIdle, Active: MoreActive },
] as const;

const matches = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/* iOS-like deceleration: fast start, long soft settle. */
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function BottomNav() {
  const pathname = usePathname();
  // Highlight the tapped tab immediately; it drops out as soon as the route actually changes.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  if (pathname.startsWith("/workout/")) return null; // focus mode while training

  const current = tapped?.from === pathname ? tapped.href : null;
  const activeIndex = tabs.findIndex((t) => (current ? t.href === current : matches(t.href, pathname)));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="منوی اصلی"
    >
      <ul className="relative mx-auto flex max-w-lg">
        {/* One indicator that glides between tabs instead of each tab toggling its own. */}
        <li
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 start-0 w-1/5 transition-[translate,opacity] duration-500 motion-reduce:transition-none",
            EASE,
            activeIndex < 0 && "opacity-0",
          )}
          style={{ translate: `calc(${Math.max(activeIndex, 0)} * 100% * var(--nav-dir))` }}
        >
          <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-accent shadow-[0_0_12px_2px_var(--accent)]" />
          <span
            key={activeIndex}
            className="animate-nav-stretch absolute top-2 left-1/2 h-8 w-14 -translate-x-1/2 rounded-full bg-accent/15 ring-1 ring-accent/20 ring-inset"
          />
        </li>

        {tabs.map(({ href, label, Idle, Active }, i) => {
          const active = i === activeIndex;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => setTapped({ href, from: pathname })}
                className={cn(
                  "group flex flex-col items-center gap-1 pt-2 pb-1.5 text-[11px] font-medium transition-colors duration-300",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative grid h-8 w-14 place-items-center transition-transform duration-200 group-active:scale-90",
                    active && "animate-nav-pop",
                  )}
                >
                  <Idle
                    size={22}
                    className={cn(
                      "absolute transition-[opacity,scale] duration-300",
                      EASE,
                      active ? "scale-75 opacity-0" : "scale-100 opacity-100",
                    )}
                  />
                  <Active
                    size={22}
                    className={cn(
                      "absolute transition-[opacity,scale] duration-300",
                      EASE,
                      active ? "scale-100 opacity-100" : "scale-75 opacity-0",
                    )}
                  />
                </span>
                <span className={cn("transition-[translate] duration-300", EASE, active && "-translate-y-px")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
