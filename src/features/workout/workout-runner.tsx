"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { formatRest } from "@/domain/plan";
import { db } from "@/infra/db/database";
import { workoutsRepo } from "@/infra/db/workouts-repo";
import { Button, Card, Empty, Spinner } from "@/shared/ui";
import { formatDuration, LOCALE } from "@/shared/lib/format";
import { blockTypeFa, faName } from "@/shared/i18n/fa";
import { ExerciseLogger } from "./exercise-logger";
import { RestTimer } from "./rest-timer";

export function WorkoutRunner({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const workout = useLiveQuery(() => db().workouts.get(workoutId), [workoutId]);
  const plan = useLiveQuery(() => (workout ? db().plans.get(workout.planId) : undefined), [workout?.planId]);
  const [rest, setRest] = useState<{ sec: number; key: number } | null>(null);

  if (workout === undefined || plan === undefined) return <Spinner />;
  if (!workout || !plan) return <Empty title="تمرین پیدا نشد" />;

  const session = plan.doc.sessions.find((s) => s.id === workout.sessionId);
  if (!session) return <Empty title="این جلسه دیگر در برنامه وجود ندارد" />;
  const corrective = plan.doc.sessions.find((s) => s.kind === "corrective" && s.id !== session.id);
  const readOnly = workout.status !== "active";

  return (
    <>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button className="text-sm text-muted" onClick={() => router.push("/")}>
            → امروز
          </button>
          <h1 className="truncate text-xl font-semibold">{faName(session)}</h1>
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
        <Card className="mb-3 text-xs text-muted">
          <span className="font-medium text-foreground">گرم کردن:</span> <span dir="auto">{session.warmup.join(" → ")}</span>
          {corrective && (
            <>
              {" "}
              <button className="text-accent" onClick={() => document.getElementById("corrective")?.scrollIntoView({ behavior: "smooth" })}>
                (حرکات اصلاحی پایین صفحه)
              </button>
            </>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {session.blocks.map((b, bi) => (
          <div key={bi} className={b.type !== "straight" ? "rounded-2xl border border-dashed border-accent/40 p-2" : undefined}>
            {b.type !== "straight" && (
              <p className="mb-2 px-2 text-[11px] text-accent">
                {blockTypeFa[b.type]}
                {b.rounds ? ` · ${b.rounds} دور` : ""}
                {b.restSec ? ` · استراحت ${formatRest(b.restSec)} بعد از هر دور` : ""}
                {b.note ? ` · ${b.note}` : ""}
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
                  onSetDone={(sec) => !readOnly && sec && setRest({ sec, key: Date.now() })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {corrective && (
        <details id="corrective" className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer font-semibold">{faName(corrective)}</summary>
          <div className="mt-3 space-y-2">
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
        </details>
      )}

      {session.cooldown && (
        <Card className="mt-4 text-xs text-muted">
          <span className="font-medium text-foreground">در پایان:</span> <span dir="auto">{session.cooldown.join(" · ")}</span>
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

      {rest && <RestTimer key={rest.key} seconds={rest.sec} onDone={() => setRest(null)} />}
    </>
  );
}
