"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDownIcon, ArrowRightIcon } from "@solar-icons/react/linear";
import { formatRest, type Block } from "@/domain/plan";
import { resolveSwap } from "@/domain/workout/swap";
import { exerciseKeyOf } from "@/domain/workout/types";
import { restAfterSet } from "@/domain/workout/rest";
import { db } from "@/infra/db/database";
import { workoutsRepo } from "@/infra/db/workouts-repo";
import { Accordion, Badge, Button, Card, Empty, Spinner, StepList } from "@/shared/ui";
import { formatDuration, LOCALE } from "@/shared/lib/format";
import { blockTypeFa, faName, faText } from "@/shared/i18n/fa";
import { ExerciseLogger } from "./exercise-logger";
import { RestTimerFab, type RestTimerHandle } from "./rest-timer";
import { usePlanSwapDefaults } from "./use-swaps";

export function WorkoutRunner({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const workout = useLiveQuery(() => db().workouts.get(workoutId), [workoutId]);
  const plan = useLiveQuery(() => (workout ? db().plans.get(workout.planId) : undefined), [workout?.planId]);
  const restTimer = useRef<RestTimerHandle>(null);
  const swapDefaults = usePlanSwapDefaults(workout?.planId);
  const logs = useLiveQuery(() => db().setLogs.where("workoutId").equals(workoutId).toArray(), [workoutId]);

  if (workout === undefined || plan === undefined) return <Spinner />;
  if (!workout || !plan) return <Empty title="تمرین پیدا نشد" />;

  const session = plan.doc.sessions.find((s) => s.id === workout.sessionId);
  if (!session) return <Empty title="این جلسه دیگر در برنامه وجود ندارد" />;
  const corrective = plan.doc.sessions.find((s) => s.kind === "corrective" && s.id !== session.id);
  const readOnly = workout.status !== "active";
  // The quick-logging hint sits on the first weighted exercise only.
  const firstBlock = session.blocks.findIndex((b) => b.exercises.some((e) => !e.seconds));
  const firstLogged = { block: firstBlock, key: session.blocks[firstBlock]?.exercises.find((e) => !e.seconds)?.key };

  // Straight sets rest after each tick; supersets and circuits after the round's last exercise.
  function onSetDone(block: Block, exKey: string, setIndex: number) {
    if (readOnly) return;
    const performedKey = (key: string) => {
      const e = block.exercises.find((x) => x.key === key)!;
      return exerciseKeyOf({ key, exerciseId: resolveSwap(e, workout!.swaps?.[key] ?? swapDefaults[key]) });
    };
    const due = restAfterSet(block, exKey, setIndex, (key, i) =>
      Boolean(logs?.some((l) => l.done && l.setIndex === i && l.exerciseKey === performedKey(key))),
    );
    if (due && due.sec !== 0) restTimer.current?.start(due.sec);
  }

  return (
    <>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button className="-ms-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted" onClick={() => router.push("/")}>
            <ArrowRightIcon size={18} /> امروز
          </button>
          <h1 className="text-xl leading-snug font-semibold text-balance">{faName(session)}</h1>
          <p className="text-xs text-muted">
            {faName(plan.doc)} · شروع {new Date(workout.startedAt).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })}
            {workout.finishedAt && ` · ${formatDuration(workout.finishedAt - workout.startedAt)}`}
          </p>
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={async () => {
              await workoutsRepo.finish(workoutId, "done");
              router.push("/history");
            }}
          >
            پایان
          </Button>
        )}
      </header>

      {session.warmup && (
        <div className="mb-3">
          <StepList title="گرم کردن" items={faText(session.warmup, session.warmupFa)}>
            {corrective && (
              <button className="mt-2 inline-flex items-center gap-1 text-accent" onClick={() => {
                  const el = document.getElementById("corrective") as HTMLDetailsElement | null;
                  if (!el) return;
                  el.open = true;
                  el.scrollIntoView({ behavior: "smooth" });
                }}>
                حرکات اصلاحی پایین صفحه <ArrowDownIcon size={16} />
              </button>
            )}
          </StepList>
        </div>
      )}

      <div className="space-y-3">
        {session.blocks.map((b, bi) => (
          <div key={bi} className={b.type !== "straight" ? "rounded-2xl border border-dashed border-accent/40 p-2" : undefined}>
            {b.type !== "straight" && (
              <p className="mb-2 px-2 text-xs text-accent">
                {blockTypeFa[b.type]}
                {b.rounds ? ` · ${b.rounds} دور` : ""}
                {b.restSec ? ` · استراحت ${formatRest(b.restSec)} بعد از هر دور` : ""}
                {b.note ? ` · ${faText(b.note, b.noteFa)}` : ""}
              </p>
            )}
            <div className="space-y-2">
              {b.exercises.map((e) => (
                <ExerciseLogger
                  key={e.key}
                  workoutId={workoutId}
                  planId={plan.id}
                  sessionId={session.id}
                  ex={e}
                  defaultRestSec={b.restSec}
                  onSetDone={(i) => onSetDone(b, e.key, i)}
                  chosenId={workout.swaps?.[e.key] ?? swapDefaults[e.key]}
                  defaultId={swapDefaults[e.key]}
                  canSwap={!readOnly}
                  showHint={!readOnly && bi === firstLogged.block && e.key === firstLogged.key}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {corrective && (
        <Accordion
          id="corrective"
          className="mt-6"
          title={faName(corrective)}
          subtitle={`${corrective.blocks.reduce((n, b) => n + b.exercises.length, 0)} حرکت`}
          leading={<Badge tone="warn">اصلاحی</Badge>}
        >
          <div className="space-y-2">
            {corrective.blocks.flatMap((b) =>
              b.exercises.map((e) => (
                <ExerciseLogger
                  key={e.key}
                  workoutId={workoutId}
                  planId={plan.id}
                  sessionId={corrective.id}
                  ex={e}
                  defaultRestSec={b.restSec}
                  onSetDone={() => undefined}
                />
              )),
            )}
          </div>
        </Accordion>
      )}

      {session.cooldown && (
        <Card className="mt-4 text-xs text-muted">
          <span className="font-medium text-foreground">در پایان:</span> <span dir="auto">{faText(session.cooldown, session.cooldownFa).join(" · ")}</span>
        </Card>
      )}

      {!readOnly && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm("این تمرین و ست‌هایش دور ریخته شوند؟")) return;
              await workoutsRepo.remove(workoutId);
              router.push("/");
            }}
          >
            دور ریختن
          </Button>
          <Button
            onClick={async () => {
              await workoutsRepo.finish(workoutId, "done");
              router.push("/history");
            }}
          >
            پایان تمرین
          </Button>
        </div>
      )}

      {!readOnly && <RestTimerFab ref={restTimer} />}
    </>
  );
}
