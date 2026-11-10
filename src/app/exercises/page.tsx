import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { ExerciseBrowser } from "@/features/exercises/exercise-browser";

export const metadata: Metadata = { title: "Exercise guide" };

export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="Guide" subtitle="Movement library with animations and cues." />
      <ExerciseBrowser />
    </>
  );
}
