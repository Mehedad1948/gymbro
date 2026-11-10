"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ExerciseGuide } from "@/features/exercises/exercise-guide";
import { Spinner } from "@/shared/ui";

// useParams is runtime data: keep it under Suspense so the shell prerenders.
function Route() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  return <ExerciseGuide exerciseId={exerciseId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Route />
    </Suspense>
  );
}
