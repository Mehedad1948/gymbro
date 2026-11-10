import type { Metadata } from "next";
import { PageHeader } from "@/shared/ui";
import { Settings } from "@/features/settings/settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="More" subtitle="Backup, appearance, install." />
      <Settings />
    </>
  );
}
