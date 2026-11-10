import type { ReactNode } from "react";
import { Card, LinkButton } from "@/shared/ui";
import { CopyButton } from "@/shared/ui/copy-button";

/**
 * Short, in-app version of docs/ai/plan-generation-guide.md for the athlete.
 * Keep the rules here in sync with that file when it changes.
 */
const AGENT_PROMPT = `Generate my next training plan.
Follow docs/ai/plan-generation-guide.md exactly, using docs/ai/athlete-context.md and docs/plan-schema.md.
My app export (backup JSON) is attached: use the best sets per exercise for startLoadKg and to decide which lifts to keep.
Days per week: as stated in athlete-context.md.
Output only the plan JSON, nothing else.`;

const FILES = ["docs/ai/plan-generation-guide.md", "docs/ai/athlete-context.md", "docs/plan-schema.md"];

export function PlanGuide() {
  return (
    <div className="space-y-4 text-sm">
      <Step n={1} title="کی؟">
        <p className="text-muted">آخر هر بلوک تمرینی (هفته آخر، بعد از اسکن مجدد بدن).</p>
      </Step>

      <Step n={2} title="آماده کن">
        <ul className="list-disc space-y-1 ps-5 text-muted">
          <li>
            نتایج اسکن جدید، تعداد روز تمرین در هفته و هر درد یا محدودیت را در <Code>athlete-context.md</Code> بنویس.
          </li>
          <li>
            از <span className="text-foreground">بیشتر ← خروجی همه داده‌ها</span> فایل پشتیبان بگیر تا ایجنت وزنه‌های قبلی را ببیند.
          </li>
        </ul>
      </Step>

      <Step n={3} title="به ایجنت بده">
        <p className="mb-2 text-muted">این سه فایل از پوشه پروژه، به‌همراه فایل پشتیبان:</p>
        <ul dir="ltr" className="mb-3 space-y-1 font-mono text-xs">
          {FILES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mb-2 text-muted">و این متن را بفرست:</p>
        <pre dir="ltr" className="mb-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs select-all">
          {AGENT_PROMPT}
        </pre>
        <CopyButton text={AGENT_PROMPT} label="کپی متن درخواست" />
      </Step>

      <Step n={4} title="قواعدی که ایجنت رعایت می‌کند">
        <ul className="list-disc space-y-1 ps-5 text-muted">
          <li>تقسیم‌بندی بر اساس روزها: ۲ روز ← تمام‌بدن A/B، ۳ روز ← تمام‌بدن A/B/C، ۴ روز ← بالاتنه/پایین‌تنه.</li>
          <li>هر عضله اصلی ۱۰ تا ۱۶ ست در هفته؛ هر جلسه با گرم کردن حداکثر ۷۵ دقیقه.</li>
          <li>حرکات چندمفصلی ۶ تا ۱۰ تکرار با ۲ تا ۳ دقیقه استراحت؛ تک‌مفصلی ۱۰ تا ۲۰ تکرار با ۶۰ تا ۹۰ ثانیه.</li>
          <li>حرکات اصلاحی: فعال‌سازی اول جلسه، کشش‌های نگه‌داشتنی آخر جلسه.</li>
          <li>۹ هفته با سبک کردن تمرین (دی‌لود) در هفته ۵ و ۹؛ شروع برنامه شنبه.</li>
          <li>همان حرکات قبلی تا جای ممکن، تا سابقه وزنه‌ها حفظ شود.</li>
        </ul>
      </Step>

      <Step n={5} title="وارد کن">
        <p className="mb-3 text-muted">JSON خروجی ایجنت را در صفحه وارد کردن بچسبان. اپ قبل از ذخیره آن را بررسی می‌کند و خطاها را نشان می‌دهد.</p>
        <LinkButton href="/plans/import" size="sm">
          وارد کردن برنامه
        </LinkButton>
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-xs text-accent">{n}</span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code dir="ltr" className="font-mono text-xs text-foreground">
      {children}
    </code>
  );
}
