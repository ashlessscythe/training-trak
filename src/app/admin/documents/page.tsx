"use client";

import { useEffect, useState } from "react";
import { SOP } from "@prisma/client";
import { DocumentsList } from "@/components/documents-list";

export default function DocumentsPage() {
  const [sops, setSops] = useState<SOP[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch("/api/sops");
        const data = await response.json();
        setSops(data);
      } catch (error) {
        console.error("Failed to fetch SOPs:", error);
      }
    };

    fetchDocs();
  }, []);

  return <DocumentsList sops={sops} />;
}
