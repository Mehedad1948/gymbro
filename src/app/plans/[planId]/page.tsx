"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { PlanDetail } from "@/features/plans/plan-detail";
import { Spinner } from "@/shared/ui";

// useParams is runtime data: keep it under Suspense so the shell prerenders.
function Route() {
  const { planId } = useParams<{ planId: string }>();
  return <PlanDetail planId={planId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Route />
    </Suspense>
  );
}
