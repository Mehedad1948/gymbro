import { PageHeader } from "@/shared/ui";
import { Today } from "@/features/today/today";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Today" subtitle="Pick up where you left off." />
      <Today />
    </>
  );
}
