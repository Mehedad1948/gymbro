"use client";

import Link from "next/link";
import type { Block, Plan, PlanExercise, Session } from "@/domain/plan";
import { formatReps, formatRest } from "@/domain/plan";
import { Accordion, Badge, CheckIcon, Chevron, Chip, StepList } from "@/shared/ui";
import { cn, formatDate } from "@/shared/lib/format";
import { blockTypeFa, faName, faText, faTerm, sessionKindFa } from "@/shared/i18n/fa";
import { StartSessionButton } from "@/features/workout/start-session-button";
import type { PlanProgress } from "./use-plans";

export const sessionHref = (planId: string, sessionId: string) => `/plans/${planId}/sessions/${sessionId}`;

export function exerciseCount(session: Session): number {
  return session.blocks.reduce((n, b) => n + b.exercises.length, 0);
}

export type TileStatus = { done?: boolean; last?: number; next?: boolean; active?: boolean };

export function tileStatus(session: Session, progress: PlanProgress | undefined): TileStatus {
  if (!progress) return {};
  return {
    done: progress.done.has(session.id),
    last: progress.last?.sessionId === session.id ? progress.last.at : undefined,
    next: progress.nextId === session.id,
    active: progress.active?.sessionId === session.id,
  };
}

/**
 * One session as a tappable card: number or check mark, name, size, focus.
 * The last finished session gets the accent (green) border so "today" is the
 * one after it; the next one is labelled too.
 */
export function SessionTile({ plan, session, index, status }: { plan: Plan; session: Session; index: number; status: TileStatus }) {
  const total = exerciseCount(session);
  const focus = session.focus ?? [];
  const isLast = status.last !== undefined;
  return (
    <Link
      href={sessionHref(plan.id, session.id)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-surface p-4 transition hover:bg-surface-2 active:scale-[0.99]",
        isLast ? "border-accent ring-1 ring-accent" : "border-border",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
          status.done ? "bg-accent text-accent-foreground" : "border border-border bg-surface-2 text-muted",
        )}
      >
        {status.done ? <CheckIcon /> : index}
        <span className="sr-only">{status.done ? "انجام شده در این دور" : "انجام نشده در این دور"}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          {status.active && <Badge tone="warn">در حال انجام</Badge>}
          {status.next && !status.active && <Badge tone="accent">نوبت بعدی</Badge>}
          {session.kind !== "training" && <Badge>{sessionKindFa[session.kind]}</Badge>}
        </span>
        <span className="mt-0.5 block leading-snug font-semibold">{faName(session)}</span>
        <span className="mt-1 block text-sm text-muted">
          {total} حرکت
          {session.durationMin ? ` · حدود ${session.durationMin} دقیقه` : ""}
        </span>
        {focus.length > 0 && (
          <span className="mt-1 block text-sm text-muted">
            {focus.slice(0, 3).map(faTerm).join("، ")}
            {focus.length > 3 ? ` و ${focus.length - 3} مورد دیگر` : ""}
          </span>
        )}
        {isLast && (
          <span className="mt-2 flex items-center gap-1 text-sm font-medium text-accent">
            <CheckIcon /> آخرین جلسه انجام‌شده · {formatDate(status.last!, { weekday: "long" })}
          </span>
        )}
      </span>

      <Chevron dir="back" className="shrink-0 text-muted" />
    </Link>
  );
}

/** Warm-up, numbered exercise list (grouped blocks framed), cool-down and notes. */
export function SessionContent({ session }: { session: Session }) {
  const starts = session.blocks.map((_, i) => session.blocks.slice(0, i).reduce((n, b) => n + b.exercises.length, 0));
  return (
    <div className="space-y-4">
      {session.warmup && <StepList title="گرم کردن" items={faText(session.warmup, session.warmupFa)} />}
      <div className="space-y-3">
        {session.blocks.map((b, i) => (
          <BlockView key={i} block={b} start={starts[i]} />
        ))}
      </div>
      {session.cooldown && <StepList title="پایان جلسه" items={faText(session.cooldown, session.cooldownFa)} />}
      {session.notes && session.notes.length > 0 && (
        <div className="rounded-xl border border-border p-3 text-sm">
          <p className="mb-1.5 font-medium">نکته‌ها</p>
          <ul dir="auto" className="list-disc space-y-1.5 ps-5 leading-relaxed text-muted">
            {faText(session.notes, session.notesFa).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BlockView({ block, start }: { block: Block; start: number }) {
  const grouped = block.type !== "straight";
  const list = (
    <ol className="divide-y divide-border">
      {block.exercises.map((e, i) => (
        <ExerciseItem key={e.key} ex={e} n={start + i + 1} />
      ))}
    </ol>
  );
  if (!grouped)
    return (
      <div className="rounded-2xl border border-border bg-surface px-3">
        {list}
        {block.note && <BlockNote note={faText(block.note, block.noteFa)} />}
      </div>
    );
  return (
    <section className="rounded-2xl border border-accent/40 bg-surface px-3" aria-label={blockTypeFa[block.type]}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border py-2 text-sm">
        <Badge tone="accent">{blockTypeFa[block.type]}</Badge>
        {block.rounds && <span className="text-muted">{block.rounds} دور</span>}
        {block.restSec !== undefined && <span className="text-muted">استراحت {formatRest(block.restSec)} بعد از هر دور</span>}
      </p>
      {list}
      {block.note && <BlockNote note={faText(block.note, block.noteFa)} />}
    </section>
  );
}

function BlockNote({ note }: { note: string }) {
  return (
    <p dir="auto" className="border-t border-border py-2 text-sm leading-relaxed text-muted">
      {note}
    </p>
  );
}

function ExerciseItem({ ex, n }: { ex: PlanExercise; n: number }) {
  const name = (
    <>
      <span className="block leading-snug font-medium">{faName(ex)}</span>
      {ex.nameFa && (
        <span dir="ltr" className="mt-0.5 block text-end text-xs text-muted">
          {ex.name}
        </span>
      )}
    </>
  );
  return (
    <li className="flex gap-3 py-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs text-muted tabular-nums" aria-hidden>
        {n}
      </span>
      <div className="min-w-0 flex-1">
        {ex.exerciseId ? (
          <Link href={`/exercises/${ex.exerciseId}`} className="-mx-1 block rounded-lg px-1 hover:bg-surface-2">
            {name}
            <span className="sr-only"> (راهنمای حرکت)</span>
          </Link>
        ) : (
          name
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>{formatReps(ex)}</Chip>
          {ex.rir !== undefined && (
            <Chip>
              <bdi>RIR {Array.isArray(ex.rir) ? ex.rir.join("–") : ex.rir}</bdi>
            </Chip>
          )}
          {ex.restSec !== undefined && <Chip>استراحت {formatRest(ex.restSec)}</Chip>}
          {ex.tempo && (
            <Chip>
              سرعت اجرا <bdi className="ms-1">{ex.tempo}</bdi>
            </Chip>
          )}
        </div>
        {ex.cue && (
          <p dir="auto" className="mt-2 text-sm leading-relaxed text-muted">
            {faText(ex.cue, ex.cueFa)}
          </p>
        )}
      </div>
    </li>
  );
}

/** Corrective / menu sessions shown inline as a collapsible section. */
export function SessionAccordion({ plan, session, hint, defaultOpen }: { plan: Plan; session: Session; hint?: string; defaultOpen?: boolean }) {
  return (
    <Accordion
      title={faName(session)}
      subtitle={[hint, `${exerciseCount(session)} حرکت`, session.durationMin && `حدود ${session.durationMin} دقیقه`].filter(Boolean).join(" · ")}
      leading={<Badge tone={session.kind === "corrective" ? "warn" : "neutral"}>{sessionKindFa[session.kind]}</Badge>}
      defaultOpen={defaultOpen}
    >
      <SessionContent session={session} />
      {session.kind === "corrective" && (
        <StartSessionButton planId={plan.id} session={session} className="mt-4 w-full" variant="secondary">
          شروع جداگانه حرکات اصلاحی
        </StartSessionButton>
      )}
    </Accordion>
  );
}
