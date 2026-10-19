"use client";

import { useParams } from "next/navigation";
import { CommunityDetailView } from "@/components/views/CommunitiesView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CommunityDetailView id={id} />;
}
