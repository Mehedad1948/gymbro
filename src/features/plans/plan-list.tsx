"use client";

import Link from "next/link";
import { usePlans, useActivePlanId } from "./use-plans";
import { plansRepo } from "@/infra/db/plans-repo";
import { Badge, Button, Card, Empty, LinkButton, Spinner } from "@/shared/ui";
import { formatDate } from "@/shared/lib/format";
import { faName, planSourceFa } from "@/shared/i18n/fa";

export function PlanList() {
  const plans = usePlans();
  const activeId = useActivePlanId();

  if (plans === undefined) return <Spinner />;
  if (plans.length === 0)
    return <Empty title="هنوز برنامه‌ای نداری" hint="برای شروع یک فایل JSON برنامه وارد کن." action={<LinkButton href="/plans/import">وارد کردن برنامه</LinkButton>} />;

  const sorted = [...plans].sort((a, b) => (a.id === activeId ? -1 : b.id === activeId ? 1 : b.updatedAt - a.updatedAt));

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((p) => {
        const active = p.id === activeId;
        const training = p.doc.sessions.filter((s) => s.kind === "training").length;
        return (
          <li key={p.id}>
            <Card className={active ? "border-accent/50" : undefined}>
              <div className="flex items-start justify-between gap-3">
                <Link href={`/plans/${p.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {active && <Badge tone="accent">فعال</Badge>}
                    <Badge>{planSourceFa[p.doc.meta.source]}</Badge>
                  </div>
                  <h2 className="mt-2 font-semibold leading-snug">{faName(p.doc)}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {p.doc.meta.split ?? `${training} جلسه`} · {p.doc.meta.durationWeeks ?? "?"} هفته ·{" "}
                    {p.doc.meta.startDate ? `از ${formatDate(p.doc.meta.startDate, { year: "numeric" })}` : formatDate(p.doc.meta.createdAt)}
                  </p>
                </Link>
                {!active && (
                  <Button variant="secondary" size="sm" onClick={() => plansRepo.setActiveId(p.id)}>
                    انتخاب
                  </Button>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
