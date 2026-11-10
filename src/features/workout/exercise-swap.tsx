"use client";

import { useState } from "react";
import type { CatalogExercise } from "@/domain/exercise/types";
import { MEDIA_ATTRIBUTION, thumbUrl } from "@/infra/catalog/media";
import { ExercisePreviewSheet } from "@/features/exercises/exercise-preview-sheet";
import { cn } from "@/shared/lib/format";
import { faTerm } from "@/shared/i18n/fa";

type Option = { id: string; title: string; catalog?: CatalogExercise };

type Props = {
  id: string;
  open: boolean;
  /** Images load only once the panel has been opened. */
  everOpened: boolean;
  options: Option[];
  originalId: string;
  chosenId: string;
  /** Plan-wide default for this exercise, if any. */
  defaultId?: string;
  onChoose: (id: string) => void;
  onSetDefault: (id: string | undefined) => void;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Inline panel under an exercise header: the prescribed movement plus its
 * alternatives. Expands with a height + fade transition, options slide in
 * staggered. Collapsed content is inert so it is skipped by focus and screen
 * readers. Tapping a thumbnail (or ⤢) opens a large animated preview sheet
 * with a "choose" action; tapping the row chooses directly.
 */
export function ExerciseSwap({ id, open, everOpened, options, originalId, chosenId, defaultId, onChoose, onSetDefault }: Props) {
  const chosenIsOriginal = chosenId === originalId;
  // The switch answers "use this in every session of this plan?" for the current choice.
  const showSwitch = !chosenIsOriginal || defaultId !== undefined;
  const switchOn = chosenIsOriginal ? defaultId === undefined : defaultId === chosenId;

  // Preview sheet: keep the last option while the exit animation runs.
  const [preview, setPreview] = useState<Option | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const openPreview = (o: Option) => {
    setPreview(o);
    setPreviewOpen(true);
  };

  return (
    <>
    <div
      id={id}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 motion-reduce:transition-none",
        EASE,
        open ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="rounded-2xl border border-border bg-surface-2/60 p-2">
          <p className="px-1 pb-2 text-xs text-muted">همان ست و تکرار، با حرکت دیگر. ست‌های ثبت‌شده همین جلسه هم منتقل می‌شوند.</p>
          <ul className="space-y-1.5">
            {options.map((o, i) => {
              const selected = o.id === chosenId;
              return (
                <li
                  key={o.id}
                  style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                  className={cn(
                    "transition-[opacity,transform] duration-300 motion-reduce:transition-none",
                    EASE,
                    open ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-1.5 transition-colors duration-200",
                      selected ? "border-accent/70 bg-accent/10" : "border-border bg-surface hover:border-accent/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openPreview(o)}
                      aria-label={`دیدن بزرگ‌تر ${o.title}`}
                      className="group relative size-16 shrink-0 overflow-hidden rounded-lg bg-white transition-transform active:scale-95"
                    >
                      {everOpened && o.catalog && !broken.has(o.id) ? (
                        // Not lazy: lazy images inside a collapsed panel may never load on iOS Safari.
                        // eslint-disable-next-line @next/next/no-img-element -- remote dataset media, cached by the SW
                        <img
                          src={thumbUrl(o.catalog)}
                          alt=""
                          width={64}
                          height={64}
                          crossOrigin="anonymous"
                          decoding="async"
                          onError={() => setBroken((s) => new Set(s).add(o.id))}
                          className="size-16 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-[10px] text-black/40">{everOpened ? "پیش‌نمایش" : ""}</span>
                      )}
                      <span aria-hidden className="absolute bottom-1 inset-e-1 grid size-5 place-items-center rounded-md bg-black/55 text-[10px] text-white">
                        ⤢
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChoose(o.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-start active:scale-[0.99] transition-transform"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium capitalize">
                          <bdi>{o.title}</bdi>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                          {o.id === originalId && (
                            <span className="rounded-full border border-border px-1.5 leading-4">برنامه</span>
                          )}
                          {o.id === defaultId && o.id !== originalId && (
                            <span className="rounded-full border border-accent/40 px-1.5 leading-4 text-accent">پیش‌فرض</span>
                          )}
                          {o.catalog && (
                            <span className="truncate">
                              {faTerm(o.catalog.target)} · {faTerm(o.catalog.equipment)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all duration-200",
                          selected ? "scale-100 border-accent bg-accent text-accent-foreground" : "scale-90 border-border text-transparent",
                        )}
                      >
                        ✓
                      </span>
                    </button>

                  </div>
                </li>
              );
            })}
          </ul>
          <p className="px-1 pt-1.5 text-[10px] text-muted">برای دیدن انیمیشن روی تصویر بزن · {MEDIA_ATTRIBUTION}</p>

          {showSwitch && (
            <div
              style={{ transitionDelay: open ? `${80 + options.length * 50}ms` : "0ms" }}
              className={cn(
                "mt-2 flex items-center justify-between gap-3 border-t border-border px-1 pt-2 transition-opacity duration-300 motion-reduce:transition-none",
                open ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="text-xs">
                {chosenIsOriginal ? "حرکت اصلی برنامه در جلسه‌های بعد" : "همین حرکت در همه جلسه‌های این برنامه"}
                <span className="block text-xs text-muted">
                  {chosenIsOriginal ? "جایگزین پیش‌فرض برداشته می‌شود" : "برای وقتی که باشگاه این دستگاه را ندارد"}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={switchOn}
                aria-label="پیش‌فرض این برنامه"
                onClick={() => {
                  if (chosenIsOriginal) onSetDefault(undefined);
                  else onSetDefault(switchOn ? undefined : chosenId);
                }}
                className={cn(
                  "relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-200",
                  switchOn ? "border-accent bg-accent" : "border-border bg-surface-3",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 inset-s-0.5 size-[18px] rounded-full shadow transition-transform duration-300",
                    EASE,
                    switchOn ? "bg-accent-foreground ltr:translate-x-4 rtl:-translate-x-4" : "bg-foreground/80",
                  )}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    <ExercisePreviewSheet
      exercise={preview?.catalog}
      title={preview?.title ?? ""}
      open={previewOpen}
      selected={preview?.id === chosenId}
      onClose={() => setPreviewOpen(false)}
      onChoose={() => {
        if (preview) onChoose(preview.id);
        setPreviewOpen(false);
      }}
    />
    </>
  );
}
