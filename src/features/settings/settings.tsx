"use client";

import { useState, useSyncExternalStore } from "react";

/* Tiny external store so the theme reads consistently on server and client. */
const listeners = new Set<() => void>();
const subscribeTheme = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const readTheme = () => {
  try {
    return localStorage.getItem("theme") ?? "";
  } catch {
    return "";
  }
};
import { exportBackup, importBackup, wipeAll } from "@/infra/db/backup";
import { bundledPlans } from "@/content/plans";
import { plansRepo } from "@/infra/db/plans-repo";
import { Button, Card, LinkButton } from "@/shared/ui";

export function Settings() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "");
  const [msg, setMsg] = useState<string>("");

  function applyTheme(t: string) {
    document.documentElement.setAttribute("data-theme", t);
    try {
      if (t) localStorage.setItem("theme", t);
      else localStorage.removeItem("theme");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }

  async function doExport() {
    const b = await exportBackup();
    const blob = new Blob([JSON.stringify(b)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gymbro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function doImport(f: File | undefined) {
    if (!f) return;
    try {
      await importBackup(JSON.parse(await f.text()));
      setMsg("پشتیبان بازیابی شد.");
    } catch (e) {
      setMsg(`بازیابی ناموفق بود: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold">برنامه‌ها</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/plans/import" variant="secondary" size="sm">
            وارد کردن فایل JSON برنامه
          </LinkButton>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await plansRepo.seedBundled(bundledPlans);
              setMsg("برنامه‌های پیش‌فرض به‌روز شدند (نسخه‌های ویرایش‌شده شما حفظ شد).");
            }}
          >
            بازگردانی برنامه‌های پیش‌فرض
          </Button>
          <LinkButton href="/plans/guide" variant="ghost" size="sm">
            راهنمای ساخت برنامه بعدی
          </LinkButton>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">پشتیبان‌گیری</h2>
        <p className="text-sm text-muted">همه داده‌ها در حافظه همین مرورگر است. مرتب خروجی بگیر، مخصوصاً قبل از عوض کردن گوشی.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={doExport}>
            خروجی همه داده‌ها
          </Button>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border bg-surface-2 px-3 text-sm">
            بازیابی پشتیبان
            <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => doImport(e.target.files?.[0])} />
          </label>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">ظاهر</h2>
        <div className="flex gap-2">
          {[
            ["", "سیستم / تیره"],
            ["dark", "تیره"],
            ["light", "روشن"],
          ].map(([v, label]) => (
            <Button key={v} size="sm" variant={theme === v ? "primary" : "secondary"} onClick={() => applyTheme(v)}>
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">نصب</h2>
        <p className="text-sm text-muted">
          آیفون: Share ← <em>Add to Home Screen</em>. اندروید: منوی مرورگر ← <em>Install app</em>. انیمیشن حرکات بعد از اولین بار دیدن ذخیره می‌شوند و آفلاین هم کار می‌کنند.
        </p>
      </Card>

      <Card className="space-y-3 border-danger/30">
        <h2 className="font-semibold text-danger">منطقه خطر</h2>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            if (!confirm("همه برنامه‌ها، تمرین‌ها و ست‌های ثبت‌شده روی این دستگاه پاک شوند؟")) return;
            await wipeAll();
            location.reload();
          }}
        >
          پاک کردن داده‌های محلی
        </Button>
      </Card>

      {msg && <p className="text-center text-sm text-muted">{msg}</p>}
      <p className="text-center text-[11px] text-muted">
        داده حرکات: hasaneyldrm/exercises-dataset (MIT) · media © Gym visual
      </p>
    </div>
  );
}
