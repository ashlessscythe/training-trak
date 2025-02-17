import { useEffect, useState } from "react";
import { SOP } from "@prisma/client";

interface UseAvailableSOPsOptions {
  siteId: string;
}

export function useAvailableSOPs({ siteId }: UseAvailableSOPsOptions) {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSOPs = async () => {

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
