"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SOPsList } from "@/components/sops-list";

export default function SiteSopsPage() {
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

  return <SOPsList siteId={siteId} title={`SOPs - ${siteName}`} />;
}
