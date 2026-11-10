"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import type { PlanExercise } from "@/domain/plan";
import { expandSets, formatReps, formatRest, type SetTarget } from "@/domain/plan";
import { suggestNext } from "@/domain/progression/suggest";
import { exerciseKeyOf, type SetLog } from "@/domain/workout/types";
import { db } from "@/infra/db/database";
import { setLogsRepo } from "@/infra/db/workouts-repo";
import { Badge } from "@/shared/ui";
import { cn, kg } from "@/shared/lib/format";
import { faName } from "@/shared/i18n/fa";

type Props = {
  workoutId: string;
  planId: string;
  sessionId: string;
  ex: PlanExercise;
  defaultRestSec?: number;
  onSetDone: (restSec: number | undefined) => void;
};

/** One exercise card inside a running workout: targets, previous, inputs. */
export function ExerciseLogger({ workoutId, planId, sessionId, ex, defaultRestSec, onSetDone }: Props) {
  const key = exerciseKeyOf(ex);
  const targets = useMemo(() => expandSets(ex), [ex]);

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
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">
              {ex.exerciseId ? (
                <Link href={`/exercises/${ex.exerciseId}`} className="underline-offset-4 hover:underline">
                  {faName(ex)}
                </Link>
              ) : (
                faName(ex)
              )}
            </h3>
            {ex.nameFa && <p dir="ltr" className="text-end text-xs text-muted">{ex.name}</p>}
          </div>
          <Badge tone={doneCount >= ex.sets ? "accent" : "neutral"}>
            {doneCount}/{ex.sets}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted">
          {formatReps(ex)}
          {ex.rir !== undefined && <> · <bdi>RIR {Array.isArray(ex.rir) ? ex.rir.join("–") : ex.rir}</bdi></>}
          {restSec ? ` · استراحت ${formatRest(restSec)}` : ""}
          {ex.tempo ? ` · تمپو ${ex.tempo}` : ""}
        </p>
        {ex.cue && <p dir="auto" className="mt-1 text-xs text-muted">{ex.cue}</p>}
        {suggestion && suggestion.direction !== "none" && (
          <p className={cn("mt-2 text-xs", suggestion.direction === "up" ? "text-accent" : "text-muted")}>
            {suggestion.direction === "up" ? "▲ " : "• "}
            {suggestion.reason}
          </p>
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
            key={t.index}
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
      <span dir="ltr" className="truncate text-end font-mono text-[11px]">
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
