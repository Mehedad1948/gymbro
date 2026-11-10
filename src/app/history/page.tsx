import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { History } from "@/features/history/history";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" subtitle="Every logged workout, newest first." />
      <History />
    </>
  );
}
