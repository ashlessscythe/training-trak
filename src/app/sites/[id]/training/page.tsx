"use client";

import { TrainingList } from "@/components/training-list";

interface TrainingPageProps {
  params: {
    id: string;
  };
}

export default function TrainingPage({ params }: TrainingPageProps) {
  return <TrainingList siteId={params.id} />;
}
