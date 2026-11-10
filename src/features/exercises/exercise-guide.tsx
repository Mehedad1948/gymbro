"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCatalog } from "@/infra/catalog/use-catalog";
import { gifUrl, MEDIA_ATTRIBUTION } from "@/infra/catalog/media";
import { db } from "@/infra/db/database";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/shared/ui";
import { formatDate, kg } from "@/shared/lib/format";
import { faTerm } from "@/shared/i18n/fa";
import { GifPlayer } from "@/shared/ui/gif-player";

export function ExerciseGuide({ exerciseId }: { exerciseId: string }) {
  const state = useCatalog();
  const history = useLiveQuery(
    () => db().setLogs.where("exerciseKey").equals(exerciseId).and((s) => s.done).reverse().sortBy("completedAt"),
    [exerciseId],
  );

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <Empty title="فهرست حرکات در دسترس نیست" hint={state.error} />;
  const ex = state.catalog.exercises.find((e) => e.id === exerciseId);
  if (!ex) return <Empty title="حرکت پیدا نشد" hint={`id ${exerciseId}`} />;

  // Group history by workout → best set per workout
  const byWorkout = new Map<string, { date: number; best: string; sets: number }>();
  for (const s of history ?? []) {
    const cur = byWorkout.get(s.workoutId);
    const label = `${kg(s.weightKg)} × ${s.seconds ? `${s.seconds} ثانیه` : s.reps}`;
    if (!cur) byWorkout.set(s.workoutId, { date: s.completedAt, best: label, sets: 1 });
    else {
      cur.sets++;
      if ((s.weightKg ?? 0) * (s.reps ?? 1) > bestScore(cur.best)) cur.best = label;
    }
  }

  return (
    <>
      <PageHeader back="/exercises" title={<span dir="ltr" className="capitalize">{ex.name}</span>} subtitle={`${faTerm(ex.target)} · ${faTerm(ex.bodyPart)} · ${faTerm(ex.equipment)}`} />
      <Card className="overflow-hidden p-0">
        <div className="bg-white">
          <GifPlayer key={ex.id} src={gifUrl(ex)} alt={`انیمیشن ${ex.name}`} controls className="mx-auto aspect-square w-full max-w-sm" />
        </div>
        <p className="px-3 py-2 text-center text-[11px] text-muted">{MEDIA_ATTRIBUTION}</p>
      </Card>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="accent">{faTerm(ex.target)}</Badge>
        {ex.secondaryMuscles.map((m) => (
          <Badge key={m}>{faTerm(m)}</Badge>
        ))}
      </div>

      {ex.steps.length > 0 && (
        <Card className="mt-4">
          <h3 className="mb-2 font-semibold">نحوه اجرا</h3>
          <ol dir="ltr" className="list-decimal space-y-1.5 ps-5 text-sm text-muted">
            {ex.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mt-4">
        <h3 className="mb-2 font-semibold">سابقه شما</h3>
        {byWorkout.size === 0 ? (
          <p className="text-sm text-muted">هنوز ستی ثبت نشده.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {[...byWorkout.values()].map((h, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span className="text-muted">{formatDate(h.date, { year: "2-digit" })}</span>
                <span className="font-mono">
                  بهترین {h.best} · {h.sets} ست
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
