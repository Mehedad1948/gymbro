"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { SessionDetail } from "@/features/plans/session-detail";
import { Spinner } from "@/shared/ui";

// useParams is runtime data: keep it under Suspense so the shell prerenders.
function Route() {
  const { planId, sessionId } = useParams<{ planId: string; sessionId: string }>();
  return <SessionDetail planId={planId} sessionId={sessionId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Route />
    </Suspense>
  );
}
