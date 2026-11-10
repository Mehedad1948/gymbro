import { Empty, LinkButton } from "@/shared/ui";

export default function NotFound() {
  return <Empty title="صفحه پیدا نشد" action={<LinkButton href="/">برو به امروز</LinkButton>} />;
}
