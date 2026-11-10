import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { History } from "@/features/history/history";

export const metadata: Metadata = { title: "تاریخچه" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="تاریخچه" subtitle="همه تمرین‌های ثبت‌شده، جدیدترین اول." />
      <History />
    </>
  );
}
