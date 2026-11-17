/*
 * Rest timer as a system notification, so the countdown is visible from the
 * lock screen / shade while the athlete is between sets.
 *
 * Web notifications cannot tick on their own (no access to Android's native
 * chronometer), so the caller re-posts the same tag once a second; with
 * `silent` + same `tag` the OS updates it in place. Each update carries a drawn
 * countdown ring as the large icon and the clock time it ends.
 * `timestamp` is the end time, so the OS's own "in 1 min" label keeps moving
 * even if the page is frozen and the updates pause.
 *
 * Posts go through one queue with a generation counter: a "running" update
 * still in flight when the timer stops or finishes is dropped instead of
 * landing last and leaving a stale countdown in the shade.
 * Everything is best-effort: no permission or no support ⇒ nothing happens.
 */

import { LOCALE } from "@/shared/lib/format";

const TAG = "gymbro-rest";
const FALLBACK_ICON = "/icons/icon-192.png";
export const REST_ACTION_MESSAGE = "gymbro-rest-action";
export type RestAction = "add30" | "stop";

type Options = NotificationOptions & {
  renotify?: boolean;
  vibrate?: number[];
  timestamp?: number;
  actions?: { action: string; title: string }[];
};

const COLORS = { bg: "#0b0f14", track: "#1f2a37", accent: "#b6f04c", text: "#e8edf2", muted: "#8a96a3" };
const FONT = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
// Keeps "1:01" left-to-right inside Persian text.
const ltr = (s: string) => `⁦${s}⁩`;

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask once, from the tap that starts the timer. Never blocks the timer. */
export function requestRestNotifications(): void {
  if (!supported() || Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => undefined);
}

let queue: Promise<void> = Promise.resolve();
let generation = 0;

function enqueue(gen: number, job: () => Promise<void>): Promise<void> {
  queue = queue.then(() => (gen === generation ? job() : undefined)).catch(() => undefined);
  return queue;
}

async function show(title: string, options: Options): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;
  const opts: Options = { tag: TAG, badge: badge(), lang: "fa", dir: "rtl", ...options };
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

async function closeAll(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const list = (await reg?.getNotifications({ tag: TAG })) ?? [];
    for (const n of list) n.close();
  } catch {
    /* ignore */
  }
}

function clock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] | undefined {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  return g ? [c, g] : undefined;
}

let badgeUrl: string | undefined;

/** Monochrome stopwatch for the status bar; Android only uses the alpha channel. */
function badge(): string {
  if (badgeUrl) return badgeUrl;
  try {
    const made = canvas(96);
    if (!made) return FALLBACK_ICON;
    const [c, g] = made;
    g.strokeStyle = g.fillStyle = "#fff";
    g.lineCap = "round";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(48, 54, 32, 0, Math.PI * 2);
    g.stroke();
    g.fillRect(38, 6, 20, 9); // crown
    g.fillRect(44, 12, 8, 10);
    g.beginPath();
    g.moveTo(48, 54);
    g.lineTo(48, 34);
    g.stroke();
    badgeUrl = c.toDataURL("image/png");
    return badgeUrl;
  } catch {
    return FALLBACK_ICON;
  }
}

/** Countdown ring in the app's colours, used as the notification's large icon. */
function ringImage(fractionLeft: number, label: string, caption?: string): string | undefined {
  try {
    const size = 256;
    const made = canvas(size);
    if (!made) return undefined;
    const [c, g] = made;
    const mid = size / 2;
    const r = 104;
    g.fillStyle = COLORS.bg;
    g.beginPath();
    g.arc(mid, mid, mid, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 16;
    g.lineCap = "round";
    g.strokeStyle = COLORS.track;
    g.beginPath();
    g.arc(mid, mid, r, 0, Math.PI * 2);
    g.stroke();
    if (fractionLeft > 0) {
      g.strokeStyle = COLORS.accent;
      g.beginPath();
      g.arc(mid, mid, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fractionLeft));
      g.stroke();
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = COLORS.text;
    g.font = `700 ${label.length > 4 ? 60 : 70}px ${FONT}`;
    g.fillText(label, mid, caption ? mid - 8 : mid + 2);
    if (caption) {
      g.fillStyle = COLORS.muted;
      g.font = `500 26px ${FONT}`;
      g.fillText(caption, mid, mid + 44);
    }
    return c.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

export function showRestRunning(leftSec: number, totalSec: number, endAt: number): Promise<void> {
  const gen = generation;
  return enqueue(gen, () => {
    const end = new Date(endAt).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
    const fraction = totalSec > 0 ? leftSec / totalSec : 0;
    return show(`استراحت · ${ltr(clock(leftSec))}`, {
      body: `تا ساعت ${ltr(end)} · از ${ltr(clock(totalSec))}`,
      icon: ringImage(fraction, clock(leftSec), "مانده") ?? FALLBACK_ICON,
      timestamp: endAt,
      silent: true,
      renotify: false,
      requireInteraction: true,
      actions: [
        { action: "add30", title: "۳۰+ ثانیه" },
        { action: "stop", title: "توقف" },
      ],
    });
  });
}

export function showRestDone(): Promise<void> {
  const gen = ++generation;
  return enqueue(gen, async () => {
    // Close first so Android treats it as a fresh alert (sound + heads-up), not a silent update.
    await closeAll();
    await show("استراحت تمام شد · برو!", {
      body: "وقت ست بعدی است",
      icon: ringImage(1, "✓") ?? FALLBACK_ICON,
      timestamp: Date.now(),
      silent: false,
      renotify: true,
      vibrate: [400, 150, 400, 150, 700],
    });
  });
}

export function clearRestNotification(): Promise<void> {
  if (!supported()) return Promise.resolve();
  const gen = ++generation;
  return enqueue(gen, closeAll);
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
