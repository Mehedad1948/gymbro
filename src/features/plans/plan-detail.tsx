"use client";

import { useRouter } from "next/navigation";
import type { Plan } from "@/domain/plan";
import { plansRepo } from "@/infra/db/plans-repo";
import { Accordion, Badge, Button, Card, Empty, PageHeader, Spinner } from "@/shared/ui";
import { formatDate } from "@/shared/lib/format";
import { usePlan, useActivePlanId, usePlanProgress } from "./use-plans";
import { faName, faText, planSourceFa } from "@/shared/i18n/fa";
import { SessionAccordion, SessionTile, tileStatus } from "./session-view";

export function PlanDetail({ planId }: { planId: string }) {
  const rec = usePlan(planId);
  const activeId = useActivePlanId();
  const progress = usePlanProgress(rec?.doc);
  const router = useRouter();

  if (rec === undefined) return <Spinner />;
  if (rec === null) return <Empty title="برنامه پیدا نشد" />;
  const plan = rec.doc;
  const active = activeId === planId;
  const correctives = plan.sessions.filter((s) => s.kind === "corrective");
  const tiles = plan.sessions.filter((s) => s.kind === "training" || s.kind === "conditioning");
  const menus = plan.sessions.filter((s) => s.kind === "menu");
  const trainingCount = tiles.filter((s) => s.kind === "training").length;

  return (
    <>
      <PageHeader
        back="/plans"
        backLabel="برنامه‌ها"
        title={faName(plan)}
        subtitle={plan.nameFa && <span dir="ltr">{plan.name}</span>}
        action={
          active ? (
            <Badge tone="accent" className="mt-1.5 shrink-0">فعال</Badge>
          ) : (
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => plansRepo.setActiveId(planId)}>
              فعال کن
            </Button>
          )
        }
      />

      <Card className="mb-6 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Meta k="نویسنده" v={plan.meta.author} />
          <Meta k="منبع" v={planSourceFa[plan.meta.source]} />
          <Meta k="تقسیم‌بندی" v={faText(plan.meta.split, plan.meta.splitFa)} />
          <Meta k="مدت" v={plan.meta.durationWeeks ? `${plan.meta.durationWeeks} هفته · ${plan.meta.daysPerWeek ?? "?"} روز در هفته` : undefined} />
          <Meta k="شروع" v={plan.meta.startDate && formatDate(plan.meta.startDate, { year: "numeric" })} />
        </dl>
        {plan.meta.goal && (
          <p dir="auto" className="mt-3 border-t border-border pt-3 leading-relaxed text-muted">
            {faText(plan.meta.goal, plan.meta.goalFa)}
          </p>
        )}
      </Card>

      {correctives.length > 0 && (
        <section aria-labelledby="corrective-h" className="mb-6 space-y-2">
          <h2 id="corrective-h" className="sr-only">حرکات اصلاحی</h2>
          {correctives.map((s) => (
            <SessionAccordion key={s.id} plan={plan} session={s} hint="قبل از هر جلسه" />
          ))}
        </section>
      )}

      <section aria-labelledby="sessions-h" className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="sessions-h" className="text-lg font-semibold">جلسه‌های تمرینی</h2>
          {progress && trainingCount > 0 && (
            <p className="text-sm text-muted">
              {progress.done.size} از {trainingCount} در این دور
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {tiles.map((s, i) => (
            <li key={s.id}>
              <SessionTile plan={plan} session={s} index={i + 1} status={tileStatus(s, progress)} />
            </li>
          ))}
        </ul>
      </section>

      {(menus.length > 0 || plan.weeks?.length || plan.guidelines?.length || plan.meta.rationale?.length) && (
        <section aria-labelledby="more-h" className="space-y-2">
          <h2 id="more-h" className="mb-3 text-lg font-semibold">جزئیات بیشتر</h2>
          {menus.map((s) => (
            <SessionAccordion key={s.id} plan={plan} session={s} hint="انتخابی" />
          ))}
          {plan.weeks && plan.weeks.length > 0 && (
            <Accordion title="هفته به هفته" subtitle={`${plan.weeks.length} هفته`}>
              <ol className="divide-y divide-border text-sm">
                {plan.weeks.map((w) => (
                  <li key={w.week} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-14 shrink-0 text-muted">هفته {w.week}</span>
                    <span dir="auto" className="leading-relaxed">
                      {w.label && <span className="block font-medium">{faText(w.label, w.labelFa)}</span>}
                      <span className="text-muted">{faText(w.instruction, w.instructionFa)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Accordion>
          )}
          {plan.guidelines && plan.guidelines.length > 0 && (
            <Accordion title="دستورالعمل‌ها" subtitle={`${plan.guidelines.length} نکته`}>
              <List items={faText(plan.guidelines, plan.guidelinesFa)} />
            </Accordion>
          )}
          {plan.meta.rationale && plan.meta.rationale.length > 0 && (
            <Accordion title="چرا این برنامه" subtitle={`${plan.meta.rationale.length} دلیل`}>
              <List items={faText(plan.meta.rationale, plan.meta.rationaleFa)} />
            </Accordion>
          )}
        </section>
      )}

      <div className="mt-8 flex gap-2">
        <Button variant="secondary" onClick={() => download(plan)}>
          خروجی JSON
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (!confirm(`«${faName(plan)}» بایگانی شود؟ ست‌های ثبت‌شده حفظ می‌شوند.`)) return;
            await plansRepo.archive(planId);
            router.push("/plans");
          }}
        >
          بایگانی
        </Button>
      </div>
    </>
  );
}

function Meta({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd dir="auto" className="mt-0.5 font-medium">{v}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul dir="auto" className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function download(plan: Plan) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${plan.id}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
