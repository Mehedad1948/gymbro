"use client";

import Link from "next/link";
import { useId } from "react";
import type { CatalogExercise } from "@/domain/exercise/types";
import { gifUrl, MEDIA_ATTRIBUTION } from "@/infra/catalog/media";
import { Badge, Button, LinkButton } from "@/shared/ui";
import { GifPlayer } from "@/shared/ui/gif-player";
import { Sheet } from "@/shared/ui/sheet";
import { faTerm } from "@/shared/i18n/fa";

type Props = {
  exercise: CatalogExercise | undefined;
  /** Display title (Persian plan name for the prescribed movement). */
  title: string;
  open: boolean;
  selected: boolean;
  onClose: () => void;
  onChoose: () => void;
};

/** Large animated preview of a movement with a "choose" action, shown before swapping. */
export function ExercisePreviewSheet({ exercise: ex, title, open, selected, onClose, onChoose }: Props) {
  const titleId = useId();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      footer={
        <div className="flex gap-2">
          <Button className="flex-1" size="lg" disabled={selected} onClick={onChoose}>
            {selected ? "انتخاب‌شده ✓" : "انتخاب این حرکت"}
          </Button>
          <Button variant="secondary" size="lg" onClick={onClose}>
            بستن
          </Button>
        </div>
      }
    >
      {ex && (
        <>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold capitalize leading-snug">
                <bdi>{title}</bdi>
              </h2>
              <p className="text-xs text-muted">
                {faTerm(ex.target)} · {faTerm(ex.bodyPart)} · {faTerm(ex.equipment)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white">
            {open && (
              <GifPlayer key={ex.id} src={gifUrl(ex)} alt={`انیمیشن ${ex.name}`} controls className="mx-auto aspect-square w-full max-w-sm" />
            )}
          </div>
          <p className="mt-1.5 text-center text-xs text-muted">{MEDIA_ATTRIBUTION}</p>

          {ex.secondaryMuscles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="accent">{faTerm(ex.target)}</Badge>
              {ex.secondaryMuscles.map((m) => (
                <Badge key={m}>{faTerm(m)}</Badge>
              ))}
            </div>
          )}

          {ex.steps.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-1.5 text-sm font-semibold">نحوه اجرا</h3>
              <ol dir="ltr" className="list-decimal space-y-1 ps-5 text-xs text-muted">
                {ex.steps.slice(0, 4).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <LinkButton href={`/exercises/${ex.id}`} variant="ghost" size="sm" className="mt-2 -ms-3">
                راهنمای کامل و سابقه ←
              </LinkButton>
            </div>
          )}
          {ex.steps.length === 0 && (
            <Link href={`/exercises/${ex.id}`} className="mt-3 inline-block text-sm text-accent">
              راهنمای کامل ←
            </Link>
          )}
        </>
      )}
    </Sheet>
  );
}
