"use client";

import { useParams } from "next/navigation";
import { SessionDetailView } from "@/components/views/SessionDetailView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <SessionDetailView id={id} />;
}
