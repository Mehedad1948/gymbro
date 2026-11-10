"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCatalog } from "@/infra/catalog/use-catalog";
import { gifUrl, MEDIA_ATTRIBUTION } from "@/infra/catalog/media";
import { db } from "@/infra/db/database";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/shared/ui";
import { formatDate, kg } from "@/shared/lib/format";

export function ExerciseGuide({ exerciseId }: { exerciseId: string }) {
  const state = useCatalog();
  const history = useLiveQuery(
    () => db().setLogs.where("exerciseKey").equals(exerciseId).and((s) => s.done).reverse().sortBy("completedAt"),
    [exerciseId],
  );

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <Empty title="Catalog unavailable" hint={state.error} />;
  const ex = state.catalog.exercises.find((e) => e.id === exerciseId);
  if (!ex) return <Empty title="Exercise not found" hint={`id ${exerciseId}`} />;

  // Group history by workout → best set per workout
  const byWorkout = new Map<string, { date: number; best: string; sets: number }>();
  for (const s of history ?? []) {
    const cur = byWorkout.get(s.workoutId);
    const label = `${kg(s.weightKg)} × ${s.seconds ? `${s.seconds}s` : s.reps}`;
    if (!cur) byWorkout.set(s.workoutId, { date: s.completedAt, best: label, sets: 1 });
    else {
      cur.sets++;
      if ((s.weightKg ?? 0) * (s.reps ?? 1) > bestScore(cur.best)) cur.best = label;
    }
  }

  return (
    <>
      <PageHeader back="/exercises" title={<span className="capitalize">{ex.name}</span>} subtitle={`${ex.target} · ${ex.bodyPart} · ${ex.equipment}`} />
      <Card className="overflow-hidden p-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote dataset media, cached by the SW */}
        <img src={gifUrl(ex)} alt={`${ex.name} animation`} className="mx-auto aspect-square w-full max-w-sm bg-white object-contain" />
        <p className="px-3 py-2 text-center text-[11px] text-muted">{MEDIA_ATTRIBUTION}</p>
      </Card>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="accent">{ex.target}</Badge>
        {ex.secondaryMuscles.map((m) => (
          <Badge key={m}>{m}</Badge>
        ))}
      </div>

      {ex.steps.length > 0 && (
        <Card className="mt-4">
          <h3 className="mb-2 font-semibold">How to</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
            {ex.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mt-4">
        <h3 className="mb-2 font-semibold">Your history</h3>
        {byWorkout.size === 0 ? (
          <p className="text-sm text-muted">No sets logged yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {[...byWorkout.values()].map((h, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span className="text-muted">{formatDate(h.date, { year: "2-digit" })}</span>
                <span className="font-mono">
                  best {h.best} · {h.sets} sets
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function bestScore(label: string): number {
  const [w, r] = label.split("×").map((s) => parseFloat(s));
  return (w || 0) * (r || 1);
}
