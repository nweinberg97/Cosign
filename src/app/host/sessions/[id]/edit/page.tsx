"use client";

import { useParams } from "next/navigation";
import { SessionFormView } from "@/components/views/SessionFormView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <SessionFormView key={id} editId={id} />;
}
