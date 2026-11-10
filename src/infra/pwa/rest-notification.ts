/*
 * Rest timer as a system notification, so the countdown is visible from the
 * lock screen / shade while the athlete is between sets.
 *
 * Web notifications cannot tick on their own (no native chronometer), so the
 * text shows the remaining time and the clock time it ends, and is refreshed
 * quietly while the app is in the background. Android requires notifications
 * to go through the service worker; desktop falls back to `new Notification`.
 * Everything is best-effort: no permission or no support ⇒ nothing happens.
 */

import { LOCALE } from "@/shared/lib/format";

const TAG = "gymbro-rest";
const ICON = "/icons/icon-192.png";

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask once, from the tap that starts the timer. Never blocks the timer. */
export function requestRestNotifications(): void {
  if (!supported() || Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => undefined);
}

async function show(title: string, options: NotificationOptions & { renotify?: boolean; vibrate?: number[] }): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;
  const opts = { tag: TAG, icon: ICON, badge: ICON, lang: "fa", dir: "rtl" as const, ...options };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(title, opts);
    new Notification(title, opts);
  } catch {
    /* Android without a worker, or blocked: ignore */
  }
}

function clock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function showRestRunning(leftSec: number, endAt: number): Promise<void> {
  const end = new Date(endAt).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return show(`⏱ استراحت · ${clock(leftSec)} مانده`, {
    body: `تمام می‌شود ساعت ${end}`,
    silent: true,
    renotify: false,
    requireInteraction: true,
  });
}

export function showRestDone(): Promise<void> {
  return show("✓ استراحت تمام شد", {
    body: "برو سراغ ست بعدی 💪",
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
