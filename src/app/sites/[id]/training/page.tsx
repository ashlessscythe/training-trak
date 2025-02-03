"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TrainingList } from "@/components/training-list";

export default function SiteTrainingPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [siteName, setSiteName] = useState("");

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}`);
        const data = await response.json();
        setSiteName(data.name);
      } catch (error) {
        console.error("Failed to fetch site:", error);
      }
    };

    fetchSite();
  }, [siteId]);

  return (
    <TrainingList siteId={siteId} title={`Training Progress - ${siteName}`} />
  );
}
