"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/format";

const tabs = [
  { href: "/", label: "امروز", icon: "◎" },
  { href: "/plans", label: "برنامه‌ها", icon: "▤" },
  { href: "/exercises", label: "راهنما", icon: "▶" },
  { href: "/history", label: "تاریخچه", icon: "⟲" },
  { href: "/settings", label: "بیشتر", icon: "⋯" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/workout/")) return null; // focus mode while training
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="منوی اصلی"
    >
      <ul className="mx-auto flex max-w-lg justify-around">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs font-medium",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
