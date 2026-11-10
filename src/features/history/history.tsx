"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/linear";
import { db } from "@/infra/db/database";
import { workoutsRepo } from "@/infra/db/workouts-repo";
import { Badge, Button, Card, Empty, Spinner } from "@/shared/ui";
import { formatDate, formatDuration, kg } from "@/shared/lib/format";
import { workoutStatusFa } from "@/shared/i18n/fa";

export function History() {
  const workouts = useLiveQuery(() => db().workouts.orderBy("startedAt").reverse().limit(100).toArray(), []);
  const logs = useLiveQuery(() => db().setLogs.toArray(), []);

  if (!workouts || !logs) return <Spinner />;
  if (workouts.length === 0) return <Empty title="هنوز تمرینی ثبت نشده" hint="یک جلسه را از صفحه امروز شروع کن؛ هر ستی که ثبت کنی اینجا می‌آید." />;

  const byWorkout = new Map<string, typeof logs>();
  for (const l of logs) {
    if (!l.done) continue;
    const arr = byWorkout.get(l.workoutId) ?? [];
    arr.push(l);
    byWorkout.set(l.workoutId, arr);
  }

  return (
    <ul className="space-y-3">
      {workouts.map((w) => {
        const sets = byWorkout.get(w.id) ?? [];
        const volume = sets.reduce((v, s) => v + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
        const exercises = [...new Set(sets.map((s) => s.exerciseName))];
        return (
          <li key={w.id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <Link href={`/workout/${w.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">{formatDate(w.startedAt, { weekday: "short", year: "numeric" })}</span>
                    {w.status !== "done" && <Badge tone={w.status === "active" ? "accent" : "warn"}>{workoutStatusFa[w.status]}</Badge>}
                  </div>
                  <h3 className="mt-1 font-semibold">{w.sessionName}</h3>
                  <p className="text-xs text-muted">
                    {sets.length} ست · حجم {kg(Math.round(volume))} کیلو
                    {w.finishedAt ? ` · ${formatDuration(w.finishedAt - w.startedAt)}` : ""}
                  </p>
                  {exercises.length > 0 && <p className="mt-1 line-clamp-2 text-xs text-muted">{exercises.join(" · ")}</p>}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="حذف تمرین"
                  onClick={() => confirm("این تمرین و ست‌هایش حذف شوند؟") && workoutsRepo.remove(w.id)}
                >
                  <TrashBinMinimalisticIcon size={18} />
                </Button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
