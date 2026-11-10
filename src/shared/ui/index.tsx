import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/format";

/* Small, dependency-free primitives. Styling lives in globals.css tokens. */

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none";
const buttonVariant = {
  primary: "bg-accent text-accent-foreground hover:brightness-110",
  secondary: "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
  ghost: "text-muted hover:text-foreground hover:bg-surface-2",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
};
const buttonSize = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-13 px-5 text-base" };

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(buttonBase, buttonVariant[variant], buttonSize[size], className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) {
  return <Link className={cn(buttonBase, buttonVariant[variant], buttonSize[size], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-surface p-4", className)} {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "accent" | "warn" }) {
  const tones = {
    neutral: "bg-surface-2 text-muted border-border",
    accent: "bg-accent/15 text-accent border-accent/30",
    warn: "bg-warn/15 text-warn border-warn/30",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn("h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground focus:border-accent focus:outline-none", className)}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  back,
  backLabel = "بازگشت",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link href={back} className="-ms-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:text-foreground">
          <span aria-hidden>→</span> {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function Spinner({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-muted/40 border-t-accent" />
      {label}
    </div>
  );
}

/**
 * Native <details> disclosure: keyboard and screen-reader support for free,
 * works before hydration. `defaultOpen` only sets the initial state.
 */
export function Accordion({
  title,
  subtitle,
  leading,
  defaultOpen,
  className,
  children,
  id,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <details id={id} open={defaultOpen} className={cn("group rounded-2xl border border-border bg-surface", className)}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl p-4 select-none [&::-webkit-details-marker]:hidden">
        {leading}
        <span className="min-w-0 flex-1">
          <span className="block leading-snug font-semibold">{title}</span>
          {subtitle && <span className="mt-0.5 block text-sm text-muted">{subtitle}</span>}
        </span>
        <Chevron className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-border p-4">{children}</div>
    </details>
  );
}

export function Chevron({ className, dir = "down" }: { className?: string; dir?: "down" | "back" }) {
  // "back" points left: the inline end in this RTL app, i.e. the "go into" arrow.
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden className={cn(dir === "back" && "rotate-90", className)}>
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden className={className}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small "label: value" pill for prescriptions (sets × reps, RIR, rest). */
export function Chip({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center rounded-lg bg-surface-2 px-2 py-0.5 text-xs text-foreground/90", className)} {...props} />;
}

/** Warmup / cooldown steps, one per line so long mixed-direction text stays readable. */
export function StepList({ title, items, children }: { title: string; items: string[]; children?: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3 text-sm">
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <ol className="space-y-2 text-muted">
        {items.map((t, i) => (
          <li key={i} className="flex items-baseline gap-2 leading-relaxed">
            <span className="shrink-0 tabular-nums text-muted/70">{(i + 1).toLocaleString("fa-IR")}.</span>
            <span dir="auto" className="min-w-0">{t}</span>
          </li>
        ))}
      </ol>
      {children}
    </div>
  );
}
