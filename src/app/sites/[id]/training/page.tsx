"use client";

import { TrainingList } from "@/components/training-list";
import { useParams } from "next/navigation";

export default function TrainingPage() {
  const params = useParams();
  const id = params.id as string;

  return <TrainingList siteId={id} />;
}
