import { useEffect, useState } from "react";
import { Document } from "@prisma/client";

export function useSiteDocuments(siteId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!siteId) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sites/${siteId}/documents`);
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [siteId]);

  return { documents, isLoading };
}
