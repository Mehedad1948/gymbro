import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { Settings } from "@/features/settings/settings";

export const metadata: Metadata = { title: "تنظیمات" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="بیشتر" subtitle="پشتیبان‌گیری، ظاهر، نصب." />
      <Settings />
    </>
  );
}
