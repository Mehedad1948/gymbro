import type { Metadata } from "next";
import { LinkButton, PageHeader } from "@/shared/ui";
import { PlanList } from "@/features/plans/plan-list";

export const metadata: Metadata = { title: "برنامه‌ها" };

export default function PlansPage() {
  return (
    <>
      <PageHeader
        title="برنامه‌ها"
        subtitle="از مربی، هوش مصنوعی یا خودت. هر بار یکی فعال است."
        action={
          <LinkButton href="/plans/import" variant="secondary" size="sm">
            وارد کردن
          </LinkButton>
        }
      />
      <PlanList />
    </>
  );
}
