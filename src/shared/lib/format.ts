export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(ts: number | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...opts });
}

export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function kg(n: number | undefined): string {
  if (n === undefined) return "–";
  return Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(/\.?0+$/, "");
}
