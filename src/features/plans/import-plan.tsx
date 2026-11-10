"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parsePlan } from "@/domain/plan";
import { plansRepo } from "@/infra/db/plans-repo";
import { Button, Card, Textarea } from "@/shared/ui";

/**
 * Paste or pick a plan JSON (produced by a coach, an AI agent following
 * docs/ai/plan-generation-guide.md, or exported from another device).
 */
export function ImportPlan() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setText(await f.text());
  }

  async function submit() {
    setBusy(true);
    const res = parsePlan(text);
    if (!res.ok) {
      setErrors(res.errors);
      setBusy(false);
      return;
    }
    const existing = await plansRepo.get(res.plan.id);
    if (existing && !confirm(`برنامه‌ای با شناسه «${res.plan.id}» وجود دارد. جایگزین شود؟`)) {
      setBusy(false);
      return;
    }
    await plansRepo.upsertImported(res.plan);
    await plansRepo.setActiveId(res.plan.id);
    router.push(`/plans/${res.plan.id}`);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <label className="block text-sm text-muted">
          یک فایل <code>.json</code> انتخاب کن
          <input
            type="file"
            accept="application/json,.json"
            className="mt-1 block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-foreground"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <p className="text-center text-xs text-muted">یا متن را اینجا بچسبان</p>
        <Textarea dir="ltr" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder='{"schemaVersion":1,"id":"my-plan", …}' />
        {errors.length > 0 && (
          <ul dir="ltr" className="rounded-xl bg-danger/10 p-3 text-xs text-danger">
            {errors.slice(0, 12).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {errors.length > 12 && <li>… و {errors.length - 12} خطای دیگر</li>}
          </ul>
        )}
        <Button className="w-full" disabled={!text.trim() || busy} onClick={submit}>
          بررسی و وارد کردن
        </Button>
      </Card>
      <p className="text-xs text-muted">
        برنامه باید طبق ساختار <code>docs/plan-schema.md</code> باشد. برای ساختن برنامه با دستیار هوش مصنوعی، فایل‌های{" "}
        <code>docs/ai/plan-generation-guide.md</code> و <code>docs/ai/athlete-context.md</code> را به آن بده.
      </p>
    </div>
  );
}
