import { Empty, LinkButton } from "@/shared/ui";

export default function NotFound() {
  return <Empty title="Page not found" action={<LinkButton href="/">Go to Today</LinkButton>} />;
}
