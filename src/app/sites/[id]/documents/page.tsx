"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SOP } from "@prisma/client";
import { DocumentsList } from "@/components/documents-list";

export default function SiteDocumentsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [sops, setSops] = useState<SOP[]>([]);
  const [siteName, setSiteName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sopsRes, siteRes] = await Promise.all([
          fetch("/api/sops").then((res) => res.json()),
          fetch(`/api/sites/${siteId}`).then((res) => res.json()),
        ]);
        setSops(sopsRes);
        setSiteName(siteRes.name);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [siteId]);

  return (
    <DocumentsList
      siteId={siteId}
      title={`Documents - ${siteName}`}
      sops={sops}
    />
  );
}
