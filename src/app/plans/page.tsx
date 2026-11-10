import type { Metadata } from "next";
import { LinkButton, PageHeader } from "@/shared/ui";
import { PlanList } from "@/features/plans/plan-list";

export const metadata: Metadata = { title: "Plans" };

export default function PlansPage() {
  return (
    <>
      <PageHeader
        title="Plans"
        subtitle="Coach, AI or your own. One is active at a time."
        action={
          <LinkButton href="/plans/import" variant="secondary" size="sm">
            Import
          </LinkButton>
        }
      />
      <PlanList />
    </>
  );
}
