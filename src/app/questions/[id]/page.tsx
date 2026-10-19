"use client";

import { useParams } from "next/navigation";
import { QuestionDetailView } from "@/components/views/QuestionsView";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <QuestionDetailView id={id} />;
}
