"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Session } from "@/domain/plan";
import { workoutsRepo } from "@/infra/db/workouts-repo";
import { Button } from "@/shared/ui";

export function StartSessionButton({
  planId,
  session,
  size = "md",
  className,
}: {
  planId: string;
  session: Session;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size={size}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const active = await workoutsRepo.activeFor(planId);
        if (active && active.sessionId === session.id) return router.push(`/workout/${active.id}`);
        if (active && !confirm(`"${active.sessionName}" is still open. Abandon it and start "${session.name}"?`)) {
          setBusy(false);
          return;
        }
        if (active) await workoutsRepo.finish(active.id, "abandoned");
        const w = await workoutsRepo.start({ planId, sessionId: session.id, sessionName: session.name });
        router.push(`/workout/${w.id}`);
      }}
    >
      Start
    </Button>
  );
}
