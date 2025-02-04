import { useEffect, useState } from "react";
import { Position } from "@prisma/client";

export function useAvailablePositions(siteId?: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!siteId) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sites/${siteId}/positions`);
        const data = await response.json();
        setPositions(data.filter((pos: Position) => pos.isActive));
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [siteId]);

  return { positions, isLoading };
}
