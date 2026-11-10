"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { WorkoutRunner } from "@/features/workout/workout-runner";
import { Spinner } from "@/shared/ui";

// useParams is runtime data: keep it under Suspense so the shell prerenders.
function Route() {
  const { workoutId } = useParams<{ workoutId: string }>();
  return <WorkoutRunner workoutId={workoutId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Route />
    </Suspense>
  );
}
