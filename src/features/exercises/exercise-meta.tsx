"use client";

import { useState } from "react";
import { MagnifierIcon } from "@solar-icons/react/linear";
import { parseTempo } from "@/domain/plan";
import { cn } from "@/shared/lib/format";

/** Small icon that opens a Google search for the exercise (English name searches best). */
export function WebSearchLink({ name, className }: { name: string; className?: string }) {
  return (
    <a
      href={`https://www.google.com/search?q=${encodeURIComponent(`${name} exercise`)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`جستجوی «${name}» در گوگل`}
      title="جستجو در گوگل"
      className={cn(
        "inline-grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
        className,
      )}
    >
      <MagnifierIcon size={16} aria-hidden />
    </a>
  );
}

const sec = (n: number) => `${n} ثانیه`;

/** Persian explanation of a tempo string, e.g. "3-1-1" → "۳ ثانیه پایین، ۱ ثانیه مکث، ۱ ثانیه بالا". */
export function tempoFa(tempo: string): string | undefined {
  const t = parseTempo(tempo);
  if (!t) return undefined;
  const parts = [
    `${sec(t.eccentric)} پایین آوردن (منفی)`,
    t.pause ? `${sec(t.pause)} مکث در پایین` : "بدون مکث در پایین",
    t.concentric ? `${sec(t.concentric)} بالا بردن (انفجاری)` : "بالا بردن انفجاری",
  ];
  if (t.top) parts.push(`${sec(t.top)} مکث در بالا`);
  return parts.join("، ");
}

/**
 * "سرعت اجرا 3-1-1" that explains itself on tap. Renders the button and the explanation
 * as siblings so a flex-wrap row can drop the explanation onto its own line.
 */
export function TempoHint({ tempo, className, explainClassName }: { tempo: string; className?: string; explainClassName?: string }) {
  const [open, setOpen] = useState(false);
  const explain = tempoFa(tempo);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("underline decoration-dotted underline-offset-4", className)}
      >
        {/* Tempo digits are ordered (eccentric-pause-concentric); keep them left-to-right in RTL. */}
        سرعت اجرا <bdi dir="ltr" className="ms-1">{tempo}</bdi>
      </button>
      {open && explain && <span className={cn("block animate-fade-in text-xs text-accent", explainClassName)}>{explain}</span>}
    </>
  );
}
