"use client";

import { Badge, CheckIcon, Empty, LinkButton, PageHeader, Spinner } from "@/shared/ui";
import { formatDate } from "@/shared/lib/format";
import { faName, faTerm, sessionKindFa } from "@/shared/i18n/fa";
import { StartSessionButton } from "@/features/workout/start-session-button";
import { usePlan, usePlanProgress } from "./use-plans";
import { exerciseCount, SessionAccordion, SessionContent, tileStatus } from "./session-view";

/** One session of a plan: what to do today, with a sticky start button. */
export function SessionDetail({ planId, sessionId }: { planId: string; sessionId: string }) {
  const rec = usePlan(planId);
  const progress = usePlanProgress(rec?.doc);

  if (rec === undefined) return <Spinner />;
  const plan = rec?.doc;
  const session = plan?.sessions.find((s) => s.id === sessionId);
  if (!plan || !session)
    return <Empty title="جلسه پیدا نشد" action={<LinkButton href={plan ? `/plans/${planId}` : "/plans"} variant="secondary">بازگشت</LinkButton>} />;

  const status = tileStatus(session, progress);
  const corrective = session.kind === "training" ? plan.sessions.find((s) => s.kind === "corrective") : undefined;

  return (
    <>
      <PageHeader back={`/plans/${planId}`} backLabel={faName(plan)} title={faName(session)} subtitle={session.nameFa && <span dir="ltr">{session.name}</span>} />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {session.kind !== "training" && <Badge tone={session.kind === "corrective" ? "warn" : "neutral"}>{sessionKindFa[session.kind]}</Badge>}
        {status.active && <Badge tone="warn">در حال انجام</Badge>}
        {status.done && <Badge tone="accent" className="gap-1"><CheckIcon className="size-3.5" /> انجام شده در این دور</Badge>}
        {status.next && !status.active && <Badge tone="accent">نوبت بعدی</Badge>}
        <span className="text-muted">
          {exerciseCount(session)} حرکت
          {session.durationMin ? ` · حدود ${session.durationMin} دقیقه` : ""}
        </span>
      </div>

      {status.last !== undefined && (
        <p className="mb-4 rounded-xl border border-accent/50 bg-accent/10 px-3 py-2 text-sm">
          آخرین بار {formatDate(status.last, { weekday: "long" })} انجام دادی.
        </p>
      )}

      {session.focus && session.focus.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          <span className="font-medium text-foreground">تمرکز: </span>
          {session.focus.map(faTerm).join("، ")}
        </p>
      )}

      {corrective && <SessionAccordion plan={plan} session={corrective} hint="قبل از تمرین" />}

      <h2 className="mt-6 mb-3 text-lg font-semibold">برنامه جلسه</h2>
      <SessionContent session={session} />

      {session.kind !== "menu" && (
        <div
          className="sticky z-10 mt-6 -mx-4 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-4 pb-2"
          style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom))" }}
        >
          <StartSessionButton planId={planId} session={session} size="lg" className="w-full">
            {status.active ? "ادامه تمرین" : "شروع این جلسه"}
          </StartSessionButton>
        </div>
      )}
    </>
  );
}
