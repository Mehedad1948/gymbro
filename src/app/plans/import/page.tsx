import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { ImportPlan } from "@/features/plans/import-plan";

export const metadata: Metadata = { title: "وارد کردن برنامه" };

export default function ImportPlanPage() {
  return (
    <>
      <PageHeader back="/plans" title="وارد کردن برنامه" subtitle="قبل از ذخیره با ساختار برنامه بررسی می‌شود." />
      <ImportPlan />
    </>
  );
}
