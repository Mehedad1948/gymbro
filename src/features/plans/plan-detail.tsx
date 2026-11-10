"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Block, Plan, PlanExercise, Session } from "@/domain/plan";
import { formatReps, formatRest } from "@/domain/plan";
import { plansRepo } from "@/infra/db/plans-repo";
import { Badge, Button, Card, Empty, PageHeader, Spinner } from "@/shared/ui";
import { usePlan, useActivePlanId } from "./use-plans";
import { StartSessionButton } from "@/features/workout/start-session-button";

export function PlanDetail({ planId }: { planId: string }) {
  const rec = usePlan(planId);
  const activeId = useActivePlanId();
  const router = useRouter();
  const [showMeta, setShowMeta] = useState(false);

  if (rec === undefined) return <Spinner />;
  if (rec === null) return <Empty title="Plan not found" />;
  const plan = rec.doc;
  const active = activeId === planId;

  return (
    <>
      <PageHeader
        back="/plans"
        title={plan.name}
        subtitle={plan.nameFa && <span className="fa">{plan.nameFa}</span>}
        action={
          active ? (
            <Badge tone="accent" className="mt-2 shrink-0">Active</Badge>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => plansRepo.setActiveId(planId)}>
              Make active
            </Button>
          )
        }
      />

      <Card className="mb-4 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Meta k="Author" v={plan.meta.author} />
          <Meta k="Source" v={plan.meta.source} />
          <Meta k="Split" v={plan.meta.split} />
          <Meta k="Length" v={plan.meta.durationWeeks ? `${plan.meta.durationWeeks} weeks · ${plan.meta.daysPerWeek ?? "?"} d/wk` : undefined} />
          <Meta k="Start" v={plan.meta.startDate} />
        </dl>
        {plan.meta.goal && <p className="mt-3 border-t border-border pt-3 text-muted">{plan.meta.goal}</p>}
        {(plan.meta.rationale?.length || plan.guidelines?.length) && (
          <button className="mt-3 text-accent" onClick={() => setShowMeta((v) => !v)}>
            {showMeta ? "Hide" : "Show"} guidelines & rationale
          </button>
        )}
        {showMeta && (
          <div className="mt-3 space-y-3">
            {plan.guidelines && <List title="Guidelines" items={plan.guidelines} />}
            {plan.meta.rationale && <List title="Why this plan" items={plan.meta.rationale} />}
          </div>
        )}
      </Card>

      {plan.weeks && plan.weeks.length > 0 && (
        <Card className="mb-4 text-sm">
          <h3 className="mb-2 font-semibold">Week by week</h3>
          <ol className="space-y-1.5">
            {plan.weeks.map((w) => (
              <li key={w.week} className="flex gap-2">
                <span className="w-8 shrink-0 font-mono text-muted">W{w.week}</span>
                <span>
                  {w.label && <span className="font-medium">{w.label} · </span>}
                  <span className="text-muted">{w.instruction}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="space-y-3">
        {plan.sessions.map((s) => (
          <SessionCard key={s.id} plan={plan} session={s} />
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        <Button variant="secondary" onClick={() => download(plan)}>
          Export JSON
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (!confirm(`Archive "${plan.name}"? Logs are kept.`)) return;
            await plansRepo.archive(planId);
            router.push("/plans");
          }}
        >
          Archive
        </Button>
      </div>
    </>
  );
}

function Meta({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{k}</dt>
      <dd className="capitalize">{v}</dd>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-1 font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function SessionCard({ plan, session, compact }: { plan: Plan; session: Session; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const total = session.blocks.reduce((n, b) => n + b.exercises.length, 0);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)}>
          <div className="flex flex-wrap items-center gap-2">
            {session.kind !== "training" && <Badge tone={session.kind === "corrective" ? "warn" : "neutral"}>{session.kind}</Badge>}
            {session.durationMin && <span className="text-xs text-muted">~{session.durationMin} min</span>}
          </div>
          <h3 className="mt-1 font-semibold leading-snug">{session.name}</h3>
          <p className="text-xs text-muted">
            {total} exercises{session.focus ? ` · ${session.focus.join(", ")}` : ""}
          </p>
        </button>
        {session.kind !== "menu" && <StartSessionButton planId={plan.id} session={session} size="sm" />}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {session.warmup && (
            <p className="text-xs text-muted">
              <span className="font-medium text-foreground">Warm-up:</span> {session.warmup.join(" → ")}
            </p>
          )}
          {session.blocks.map((b, i) => (
            <BlockRow key={i} block={b} />
          ))}
          {session.cooldown && (
            <p className="text-xs text-muted">
              <span className="font-medium text-foreground">Finish:</span> {session.cooldown.join(" · ")}
            </p>
          )}
          {session.notes?.map((n, i) => (
            <p key={i} className="text-xs text-muted">{n}</p>
          ))}
        </div>
      )}
    </Card>
  );
}

function BlockRow({ block }: { block: Block }) {
  const grouped = block.type !== "straight";
  return (
    <div className={grouped ? "rounded-xl border border-dashed border-border p-2" : undefined}>
      {grouped && (
        <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">
          {block.type}
          {block.rounds ? ` · ${block.rounds} rounds` : ""}
          {block.restSec ? ` · rest ${formatRest(block.restSec)}` : ""}
        </p>
      )}
      <ul className="space-y-1.5">
        {block.exercises.map((e) => (
          <ExerciseRow key={e.key} ex={e} />
        ))}
      </ul>
    </div>
  );
}

function ExerciseRow({ ex }: { ex: PlanExercise }) {
  const inner = (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className="font-medium">{ex.name}</span>
        {ex.nameFa && <span className="fa ms-2 text-xs text-muted">{ex.nameFa}</span>}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted">
        {formatReps(ex)}
        {ex.rir !== undefined && ` · RIR ${Array.isArray(ex.rir) ? ex.rir.join("–") : ex.rir}`}
        {ex.restSec ? ` · ${formatRest(ex.restSec)}` : ""}
      </span>
    </div>
  );
  return (
    <li>
      {ex.exerciseId ? (
        <Link href={`/exercises/${ex.exerciseId}`} className="block rounded-lg hover:bg-surface-2">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
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
