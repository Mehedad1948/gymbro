"use client";

import Link from "next/link";
import { useActivePlan, usePlanProgress } from "@/features/plans/use-plans";
import { SessionTile, tileStatus } from "@/features/plans/session-view";
import { StartSessionButton } from "@/features/workout/start-session-button";
import { Badge, Card, Empty, LinkButton, Spinner } from "@/shared/ui";
import { formatDate } from "@/shared/lib/format";
import { faName, faText } from "@/shared/i18n/fa";

/**
 * Home: the active plan, the open workout if any, and the next session to do
 * (the first training session not yet completed in the current cycle).
 */
export function Today() {
  const rec = useActivePlan();
  const progress = usePlanProgress(rec?.doc);

  if (rec === undefined || (rec && progress === undefined)) return <Spinner />;
  if (!rec)
    return <Empty title="برنامه فعالی نداری" hint="یک برنامه انتخاب کن یا وارد کن." action={<LinkButton href="/plans">برنامه‌ها</LinkButton>} />;

  const plan = rec.doc;
  const open = progress?.active;
  const tiles = plan.sessions.filter((s) => s.kind === "training" || s.kind === "conditioning");
  const next = tiles.find((s) => s.id === progress?.nextId);

  const week = weekOf(plan.meta.startDate);
  const weekInfo = week ? plan.weeks?.find((w) => w.week === week) : undefined;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-surface to-surface-2">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/plans/${plan.id}`} className="-m-1 min-w-0 rounded-lg p-1">
            <p className="text-xs text-muted">برنامه فعال</p>
            <h2 className="leading-snug font-semibold">{faName(plan)}</h2>
          </Link>
          {week && <Badge tone="accent">هفته {week}{plan.meta.durationWeeks ? ` از ${plan.meta.durationWeeks}` : ""}</Badge>}
        </div>
        {weekInfo && (
          <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">{weekInfo.label ? faText(weekInfo.label, weekInfo.labelFa) : `هفته ${weekInfo.week}`}:</span> <span dir="auto">{faText(weekInfo.instruction, weekInfo.instructionFa)}</span>
          </p>
        )}
      </Card>

      {open && (
        <Card className="border-accent/50">
          <p className="text-xs text-accent">در حال انجام</p>
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

      {next && !open && (
        <section aria-labelledby="next-h">
          <h2 id="next-h" className="mb-2 text-sm font-medium text-muted">جلسه بعدی</h2>
          <SessionTile plan={plan} session={next} index={tiles.indexOf(next) + 1} status={tileStatus(next, progress)} />
          <StartSessionButton planId={plan.id} session={next} size="lg" className="mt-3 w-full">
            شروع جلسه
          </StartSessionButton>
        </section>
      )}

      <section aria-labelledby="all-h">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="all-h" className="text-sm font-medium text-muted">همه جلسه‌ها</h2>
          <Link href={`/plans/${plan.id}`} className="rounded text-sm text-accent">
            جزئیات برنامه
          </Link>
        </div>
        <ul className="space-y-2">
          {tiles
            .filter((s) => open || s.id !== next?.id)
            .map((s) => (
              <li key={s.id}>
                <SessionTile plan={plan} session={s} index={tiles.indexOf(s) + 1} status={tileStatus(s, progress)} />
              </li>
            ))}
        </ul>
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
