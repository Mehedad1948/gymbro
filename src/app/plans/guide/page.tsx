import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { PlanGuide } from "@/features/plans/plan-guide";

export const metadata: Metadata = { title: "راهنمای ساخت برنامه" };

export default function PlanGuidePage() {
  return (
    <>
      <PageHeader back="/plans" title="ساخت برنامه بعدی" subtitle="ساختن برنامه جدید با ایجنت هوش مصنوعی، در ۵ قدم." />
      <PlanGuide />
    </>
  );
}
