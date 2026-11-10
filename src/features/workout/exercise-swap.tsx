"use client";

import Link from "next/link";
import type { CatalogExercise } from "@/domain/exercise/types";
import { thumbUrl } from "@/infra/catalog/media";
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
 * readers.
 */
export function ExerciseSwap({ id, open, everOpened, options, originalId, chosenId, defaultId, onChoose, onSetDefault }: Props) {
  const chosenIsOriginal = chosenId === originalId;
  // The switch answers "use this in every session of this plan?" for the current choice.
  const showSwitch = !chosenIsOriginal || defaultId !== undefined;
  const switchOn = chosenIsOriginal ? defaultId === undefined : defaultId === chosenId;

  return (
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
          <p className="px-1 pb-2 text-[11px] text-muted">همان ست و تکرار، با حرکت دیگر. ست‌های ثبت‌شده همین جلسه هم منتقل می‌شوند.</p>
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
                      aria-pressed={selected}
                      onClick={() => onChoose(o.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-start active:scale-[0.99] transition-transform"
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-white">
                        {everOpened && o.catalog && (
                          // eslint-disable-next-line @next/next/no-img-element -- remote dataset media, cached by the SW
                          <img src={thumbUrl(o.catalog)} alt="" width={48} height={48} loading="lazy" className="size-12 object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium capitalize">
                          <bdi>{o.title}</bdi>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
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
                    <Link
                      href={`/exercises/${o.id}`}
                      aria-label="راهنمای حرکت"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-xs text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
                    >
                      ▶
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

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
                <span className="block text-[11px] text-muted">
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
                    "absolute top-0.5 start-0.5 size-[18px] rounded-full shadow transition-transform duration-300",
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
  );
}
