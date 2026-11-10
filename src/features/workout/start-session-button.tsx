"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Session } from "@/domain/plan";
import { workoutsRepo } from "@/infra/db/workouts-repo";
import { Button } from "@/shared/ui";
import { faName } from "@/shared/i18n/fa";

export function StartSessionButton({
  planId,
  session,
  size = "md",
  variant,
  className,
  children = "شروع",
}: {
  planId: string;
  session: Session;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const active = await workoutsRepo.activeFor(planId);
        if (active && active.sessionId === session.id) return router.push(`/workout/${active.id}`);
        if (active && !confirm(`«${active.sessionName}» هنوز باز است. رهایش کنی و «${faName(session)}» را شروع کنی؟`)) {
          setBusy(false);
          return;
        }
        if (active) await workoutsRepo.finish(active.id, "abandoned");
        const w = await workoutsRepo.start({ planId, sessionId: session.id, sessionName: faName(session) });
        router.push(`/workout/${w.id}`);
      }}
    >
      {children}
    </Button>
  );
}
