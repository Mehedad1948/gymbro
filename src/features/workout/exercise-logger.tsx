"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useId, useState } from "react";
import type { PlanExercise } from "@/domain/plan";
import { expandSets, formatReps, formatRest, type SetTarget } from "@/domain/plan";
import { suggestNext } from "@/domain/progression/suggest";
import { exerciseKeyOf, type SetLog } from "@/domain/workout/types";
import { applySwap, resolveSwap, swapOptions } from "@/domain/workout/swap";
import { getCatalogSync } from "@/infra/catalog/catalog";
import { useCatalog } from "@/infra/catalog/use-catalog";
import { swapsRepo } from "@/infra/db/swaps-repo";
import { db } from "@/infra/db/database";
import { setLogsRepo } from "@/infra/db/workouts-repo";
import { Badge } from "@/shared/ui";
import { cn, kg, titleCase } from "@/shared/lib/format";
import { faName, faText } from "@/shared/i18n/fa";
import { ExerciseSwap } from "./exercise-swap";

type Props = {
  workoutId: string;
  planId: string;
  sessionId: string;
  ex: PlanExercise;
  defaultRestSec?: number;
  onSetDone: (restSec: number | undefined) => void;
  /** Alternative chosen for this workout, else the plan default (catalog id). */
  chosenId?: string;
  /** Plan-wide default alternative for this exercise. */
  defaultId?: string;
  /** Show the alternatives picker (active workouts only). */
  canSwap?: boolean;
};

/** One exercise card inside a running workout: targets, previous, inputs. */
export function ExerciseLogger({ workoutId, planId, sessionId, ex: planEx, defaultRestSec, onSetDone, chosenId, defaultId, canSwap }: Props) {
  // The catalog gives names, media and equipment for alternatives.
  const catalogReady = useCatalog().status === "ready";
  const catalog = catalogReady ? getCatalogSync() : undefined;
  const options = swapOptions(planEx);
  const performedId = resolveSwap(planEx, chosenId);
  const alt = performedId && performedId !== planEx.exerciseId ? catalog?.get(performedId) : undefined;
  const ex = applySwap(planEx, alt && { id: alt.id, name: titleCase(alt.name), equipment: alt.equipment });
  const swapped = ex !== planEx;
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapSeen, setSwapSeen] = useState(false);
  const swapPanelId = useId();

  const key = exerciseKeyOf(ex);
  const targets = expandSets(ex);

  const logs = useLiveQuery(
    () => db().setLogs.where("[workoutId+exerciseKey]").equals([workoutId, key]).sortBy("setIndex"),
    [workoutId, key],
  );
  const [previous, setPrevious] = useState<SetLog[] | undefined>();
  useEffect(() => {
    setLogsRepo.lastPerformance(key, workoutId).then(setPrevious);
  }, [key, workoutId]);

  const suggestion = previous ? suggestNext(ex, previous) : undefined;
  const doneCount = logs?.filter((l) => l.done).length ?? 0;
  const restSec = ex.restSec ?? defaultRestSec;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <header className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <div key={key} className="min-w-0 animate-fade-in">
            <h3 className="font-semibold leading-snug">
              {ex.exerciseId ? (
                <Link href={`/exercises/${ex.exerciseId}`} className="underline-offset-4 hover:underline">
                  <bdi>{faName(ex)}</bdi>
                </Link>
              ) : (
                faName(ex)
              )}
            </h3>
            {swapped ? (
              <p className="text-xs text-accent">⇄ به‌جای {faName(planEx)}</p>
            ) : (
              ex.nameFa && <p dir="ltr" className="text-end text-xs text-muted">{ex.name}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {canSwap && options.length > 1 && (
              <button
                type="button"
                aria-expanded={swapOpen}
                aria-controls={swapPanelId}
                onClick={() => {
                  setSwapSeen(true);
                  setSwapOpen((o) => !o);
                }}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors duration-200",
                  swapOpen || swapped ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground",
                )}
              >
                <span aria-hidden className={cn("inline-block transition-transform duration-300", swapOpen && "rotate-180")}>
                  ⇄
                </span>
                جایگزین
              </button>
            )}
            <Badge tone={doneCount >= ex.sets ? "accent" : "neutral"}>
              {doneCount}/{ex.sets}
            </Badge>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">
          {formatReps(ex)}
          {ex.rir !== undefined && <> · <bdi>RIR {Array.isArray(ex.rir) ? ex.rir.join("–") : ex.rir}</bdi></>}
          {restSec ? ` · استراحت ${formatRest(restSec)}` : ""}
          {/* Tempo digits are ordered (eccentric-pause-concentric); keep them left-to-right in RTL. */}
          {ex.tempo && <> · سرعت اجرا <bdi dir="ltr">{ex.tempo}</bdi></>}
        </p>
        {ex.cue && <p dir="auto" className="mt-1 text-xs text-muted">{faText(ex.cue, ex.cueFa)}</p>}
        {suggestion && suggestion.direction !== "none" && (
          <p className={cn("mt-2 text-xs", suggestion.direction === "up" ? "text-accent" : "text-muted")}>
            {suggestion.direction === "up" ? "▲ " : "• "}
            {suggestion.reason}
          </p>
        )}
        {canSwap && options.length > 1 && planEx.exerciseId && performedId && (
          <ExerciseSwap
            id={swapPanelId}
            open={swapOpen}
            everOpened={swapSeen}
            originalId={planEx.exerciseId}
            chosenId={performedId}
            defaultId={defaultId}
            options={options.map((id) => {
              const c = catalog?.get(id);
              return { id, catalog: c, title: id === planEx.exerciseId ? faName(planEx) : c ? titleCase(c.name) : id };
            })}
            onChoose={async (id) => {
              const c = catalog?.get(id);
              await swapsRepo.choose({
                workoutId,
                key: planEx.key,
                fromKey: key,
                toId: id,
                toName: id === planEx.exerciseId ? planEx.name : c ? titleCase(c.name) : id,
              });
              // Let the check mark land before the panel folds away.
              setTimeout(() => setSwapOpen(false), 320);
            }}
            onSetDefault={(id) => swapsRepo.setDefault(planId, planEx.key, id)}
          />
        )}
      </header>

      <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_3.5rem_2.75rem] items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>ست</span>
        <span>قبلی</span>
        <span className="text-center">کیلو</span>
        <span className="text-center">{ex.seconds ? "ثانیه" : "تکرار"}</span>
        <span className="text-center">RIR</span>
        <span />
        {targets.map((t) => (
          <SetRow
            key={`${key}-${t.index}`}
            target={t}
            prev={previous?.find((p) => p.setIndex === t.index)}
            log={logs?.find((l) => l.setIndex === t.index)}
            seedWeight={suggestion?.weightKg ?? ex.startLoadKg ?? logs?.findLast((l) => l.weightKg !== undefined)?.weightKg}
            timeBased={Boolean(ex.seconds)}
            onSave={async (patch) => {
              await setLogsRepo.upsertSet({
                workoutId,
                planId,
                sessionId,
                exerciseKey: key,
                exerciseName: ex.name,
                setIndex: t.index,
                ...patch,
              });
              if (patch.done) onSetDone(restSec);
            }}
          />
        ))}
      </div>
    </section>
  );
}

type Patch = { weightKg?: number; reps?: number; seconds?: number; rir?: number; done: boolean };

function SetRow({
  target,
  prev,
  log,
  seedWeight,
  timeBased,
  onSave,
}: {
  target: SetTarget;
  prev?: SetLog;
  log?: SetLog;
  seedWeight?: number;
  timeBased: boolean;
  onSave: (p: Patch) => Promise<void>;
}) {
  // Drafts while editing; once a set is done the saved log is the source of truth.
  const [draftW, setW] = useState<string>("");
  const [draftR, setR] = useState<string>("");
  const [draftRir, setRir] = useState<string>("");

  const done = log?.done ?? false;
  const w = done ? str(log?.weightKg) : draftW;
  const r = done ? str(timeBased ? log?.seconds : log?.reps) : draftR;
  const rir = done ? str(log?.rir) : draftRir;
  const targetReps = target.reps ?? (target.repRange ? target.repRange[1] : undefined);
  const placeholderW = seedWeight !== undefined ? kg(seedWeight) : prev?.weightKg !== undefined ? kg(prev.weightKg) : "–";
  const placeholderR = timeBased ? String(target.seconds ?? "") : targetReps ? String(targetReps) : "";

  async function toggle() {
    if (done) {
      // Undo: copy saved values into the drafts so they stay editable.
      setW(w);
      setR(r);
      setRir(rir);
      return onSave({ done: false, weightKg: num(w), reps: timeBased ? undefined : num(r), seconds: timeBased ? num(r) : undefined, rir: num(rir) });
    }
    const weightKg = num(w) ?? seedWeight ?? prev?.weightKg;
    const repsOrSec = num(r) ?? (timeBased ? target.seconds : targetReps);
    await onSave({
      done: true,
      weightKg,
      reps: timeBased ? undefined : repsOrSec,
      seconds: timeBased ? repsOrSec : undefined,
      rir: num(rir) ?? target.rir,
    });
  }

  const cell = "h-10 w-full rounded-lg border border-border bg-surface-2 text-center font-mono text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-60";

  return (
    <>
      <span className="font-mono text-sm text-foreground">{target.index + 1}</span>
      <span dir="ltr" className="truncate text-end font-mono text-xs">
        {prev ? `${kg(prev.weightKg)} × ${timeBased ? `${prev.seconds}s` : prev.reps}${prev.rir !== undefined ? ` @${prev.rir}` : ""}` : target.repRange ? `${target.repRange[0]}–${target.repRange[1]}` : "—"}
      </span>
      <input type="number" inputMode="decimal" step="0.5" className={cell} placeholder={placeholderW} value={w} disabled={done} onChange={(e) => setW(e.target.value)} />
      <input type="number" inputMode="numeric" className={cell} placeholder={placeholderR} value={r} disabled={done} onChange={(e) => setR(e.target.value)} />
      <input type="number" inputMode="numeric" min={0} max={10} className={cell} placeholder={target.rir?.toString() ?? ""} value={rir} disabled={done} onChange={(e) => setRir(e.target.value)} />
      <button
        aria-label={done ? "لغو ست" : "ثبت ست"}
        onClick={toggle}
        className={cn(
          "h-10 w-full rounded-lg border text-lg font-bold transition",
          done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface-2 text-muted hover:border-accent",
        )}
      >
        ✓
      </button>
    </>
  );
}

function str(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function num(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
