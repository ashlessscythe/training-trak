"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DocumentsList } from "@/components/features/documents/documents-list";
import { useSiteSOPs } from "@/hooks/useSiteSOPs";

export default function SiteDocumentsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { sops } = useSiteSOPs(siteId);
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
    <DocumentsList
      siteId={siteId}
      title={`Documents - ${siteName}`}
      sops={sops}
    />
  );
}
