import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { ImportPlan } from "@/features/plans/import-plan";

export const metadata: Metadata = { title: "Import plan" };

export default function ImportPlanPage() {
  return (
    <>
      <PageHeader back="/plans" title="Import plan" subtitle="Validated against the plan schema before it is saved." />
      <ImportPlan />
    </>
  );
}
