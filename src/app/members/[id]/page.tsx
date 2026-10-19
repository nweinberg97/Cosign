"use client";

import { useParams } from "next/navigation";
import { MemberView } from "@/components/views/ProfileView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <MemberView id={id} />;
}
