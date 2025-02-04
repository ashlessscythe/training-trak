import { useEffect, useState } from "react";
import { SOP } from "@prisma/client";

export function useSiteSOPs(siteId?: string) {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSOPs = async () => {
      if (!siteId) {
        setSOPs([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sites/${siteId}/sops`);
        const data = await response.json();
        setSOPs(data.filter((sop: SOP) => sop.isActive));
      } catch (error) {
        console.error("Failed to fetch SOPs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSOPs();
  }, [siteId]);

  return { sops, isLoading };
}
