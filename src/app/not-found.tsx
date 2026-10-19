import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";

export default function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="That page doesn&apos;t exist"
      body="It may have moved, or the link is out of date."
      action={<ButtonLink href="/">Back to Home</ButtonLink>}
    />
  );
}
