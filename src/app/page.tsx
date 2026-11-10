import { PageHeader } from "@/shared/ui";
import { Today } from "@/features/today/today";

export default function HomePage() {
  return (
    <>
      <PageHeader title="امروز" subtitle="از همان‌جا که مانده بودی ادامه بده." />
      <Today />
    </>
  );
}
