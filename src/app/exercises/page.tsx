import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { ExerciseBrowser } from "@/features/exercises/exercise-browser";

export const metadata: Metadata = { title: "راهنمای حرکات" };

export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="راهنما" subtitle="کتابخانه حرکات با انیمیشن و نکات اجرا." />
      <ExerciseBrowser />
    </>
  );
}
