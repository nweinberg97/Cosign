"use client";

import { useParams } from "next/navigation";
import { ResourceDetailView } from "@/components/views/ResourcesView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ResourceDetailView id={id} />;
}
