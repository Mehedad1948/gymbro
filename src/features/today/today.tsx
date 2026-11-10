"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useActivePlan } from "@/features/plans/use-plans";
import { SessionCard } from "@/features/plans/plan-detail";
import { db } from "@/infra/db/database";
import { Badge, Card, Empty, LinkButton, Spinner } from "@/shared/ui";
import { formatDate } from "@/shared/lib/format";
import { faName } from "@/shared/i18n/fa";

/**
 * Home: the active plan, the open workout if any, and the next session to do
 * (the first training session not yet completed in the current cycle).
 */
export function Today() {
  const rec = useActivePlan();
  const recent = useLiveQuery(
    () => (rec ? db().workouts.where("planId").equals(rec.id).reverse().sortBy("startedAt") : []),
    [rec?.id],
  );

  if (rec === undefined || recent === undefined) return <Spinner />;
  if (!rec)
    return <Empty title="برنامه فعالی نداری" hint="یک برنامه انتخاب کن یا وارد کن." action={<LinkButton href="/plans">برنامه‌ها</LinkButton>} />;

  const plan = rec.doc;
  const open = recent.find((w) => w.status === "active");
  const training = plan.sessions.filter((s) => s.kind === "training");
  const doneIds = recent.filter((w) => w.status === "done").map((w) => w.sessionId);

  // Next = first training session whose last completion is the oldest (or never).
  const next = [...training].sort((a, b) => lastDone(a.id) - lastDone(b.id))[0];
  function lastDone(id: string) {
    const i = doneIds.indexOf(id);
    return i === -1 ? -1 : recent!.filter((w) => w.status === "done")[i].startedAt;
  }

  const week = weekOf(plan.meta.startDate);
  const weekInfo = week ? plan.weeks?.find((w) => w.week === week) : undefined;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-surface to-surface-2">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/plans/${plan.id}`} className="min-w-0">
            <p className="text-[11px] text-muted">برنامه فعال</p>
            <h2 className="truncate font-semibold">{faName(plan)}</h2>
          </Link>
          {week && <Badge tone="accent">هفته {week}{plan.meta.durationWeeks ? ` از ${plan.meta.durationWeeks}` : ""}</Badge>}
        </div>
        {weekInfo && (
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-foreground">{weekInfo.label ?? `هفته ${weekInfo.week}`}:</span> <span dir="auto">{weekInfo.instruction}</span>
          </p>
        )}
      </Card>

      {open && (
        <Card className="border-accent/50">
          <p className="text-[11px] text-accent">در حال انجام</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{open.sessionName}</p>
              <p className="text-xs text-muted">شروع {formatDate(open.startedAt, { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <LinkButton href={`/workout/${open.id}`} size="sm">
              ادامه
            </LinkButton>
          </div>
        </Card>
      )}

      {next && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted">جلسه بعدی</h3>
          <SessionCard plan={plan} session={next} />
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-medium text-muted">همه جلسه‌ها</h3>
        <div className="space-y-2">
          {plan.sessions
            .filter((s) => s.id !== next?.id)
            .map((s) => (
              <SessionCard key={s.id} plan={plan} session={s} compact />
            ))}
        </div>
      </section>
    </div>
  );
}

function weekOf(startDate: string | undefined): number | undefined {
  if (!startDate) return undefined;
  const start = new Date(startDate).getTime();
  const diff = Date.now() - start;
  if (diff < 0) return undefined;
  return Math.floor(diff / (7 * 86_400_000)) + 1;
}
