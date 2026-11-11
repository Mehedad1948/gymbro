/*
 * Rest timer as a system notification, so the countdown is visible from the
 * lock screen / shade while the athlete is between sets.
 *
 * Web notifications cannot tick on their own (no access to Android's native
 * chronometer), so the caller re-posts the same tag once a second while the
 * app is hidden; with `silent` + same `tag` the OS updates it in place. Each
 * update carries a drawn countdown ring as the large icon, a progress bar and
 * the clock time it ends, plus "+30 s" / "stop" action buttons that the
 * service worker relays back to the page (`REST_ACTION_MESSAGE`).
 * Everything is best-effort: no permission or no support ⇒ nothing happens.
 */

import { LOCALE } from "@/shared/lib/format";

const TAG = "gymbro-rest";
const BADGE = "/icons/icon-192.png";
export const REST_ACTION_MESSAGE = "gymbro-rest-action";
export type RestAction = "add30" | "stop";

type Options = NotificationOptions & { renotify?: boolean; vibrate?: number[]; actions?: { action: string; title: string }[] };

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask once, from the tap that starts the timer. Never blocks the timer. */
export function requestRestNotifications(): void {
  if (!supported() || Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => undefined);
}

async function show(title: string, options: Options): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;
  const opts: Options = { tag: TAG, badge: BADGE, lang: "fa", dir: "rtl", ...options };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(title, opts);
    // Page notifications cannot carry actions.
    delete opts.actions;
    new Notification(title, opts);
  } catch {
    /* Android without a worker, or blocked: ignore */
  }
}

function clock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** ▰▰▰▰▱▱▱▱▱▱ — reads as a bar in any notification font. */
function bar(fraction: number, cells = 12): string {
  const full = Math.round(Math.min(1, Math.max(0, fraction)) * cells);
  return "▰".repeat(full) + "▱".repeat(cells - full);
}

/** Countdown ring in the app's colours, used as the notification's large icon. */
function ringImage(fractionLeft: number, label: string): string | undefined {
  try {
    const size = 192;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    if (!g) return undefined;
    const mid = size / 2;
    const r = 78;
    g.fillStyle = "#0b0f14";
    g.beginPath();
    g.arc(mid, mid, mid, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 14;
    g.lineCap = "round";
    g.strokeStyle = "#243040";
    g.beginPath();
    g.arc(mid, mid, r, 0, Math.PI * 2);
    g.stroke();
    if (fractionLeft > 0) {
      g.strokeStyle = "#b6f04c";
      g.beginPath();
      g.arc(mid, mid, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fractionLeft));
      g.stroke();
    }
    g.fillStyle = "#e8edf2";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `700 ${label.length > 4 ? 44 : 52}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    g.fillText(label, mid, mid + 2);
    return c.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

export function showRestRunning(leftSec: number, totalSec: number, endAt: number): Promise<void> {
  const end = new Date(endAt).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
  const fraction = totalSec > 0 ? leftSec / totalSec : 0;
  return show(`استراحت  ${clock(leftSec)}`, {
    body: `${bar(1 - fraction)}\nتمام می‌شود ساعت ${end} · از ${clock(totalSec)}`,
    icon: ringImage(fraction, clock(leftSec)) ?? BADGE,
    silent: true,
    renotify: false,
    actions: [
      { action: "add30", title: "۳۰+ ثانیه" },
      { action: "stop", title: "توقف" },
    ],
  });
}

export function showRestDone(): Promise<void> {
  return show("استراحت تمام شد · برو!", {
    body: "وقت ست بعدی است 💪",
    icon: ringImage(1, "✓") ?? BADGE,
    silent: false,
    renotify: true,
    vibrate: [200, 100, 200],
  });
}

export async function clearRestNotification(): Promise<void> {
  if (!supported()) return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const list = (await reg?.getNotifications({ tag: TAG })) ?? [];
    for (const n of list) n.close();
  } catch {
    /* ignore */
  }
}

/** Calls `handler` when an action button on the rest notification is tapped. */
export function onRestAction(handler: (action: RestAction) => void): () => void {
  const sw = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
  if (!sw) return () => undefined;
  const listener = (e: MessageEvent) => {
    if (e.data?.type === REST_ACTION_MESSAGE && (e.data.action === "add30" || e.data.action === "stop")) handler(e.data.action);
  };
  sw.addEventListener("message", listener);
  return () => sw.removeEventListener("message", listener);
}
