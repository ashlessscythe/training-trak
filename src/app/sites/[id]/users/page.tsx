"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Site, Department, Position } from "@prisma/client";
import { UsersList } from "@/components/users-list";

export default function SiteUsersPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [site, setSite] = useState<Site>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, departmentsRes, positionsRes] = await Promise.all([
          fetch(`/api/sites/${siteId}`).then((res) => res.json()),
          fetch(`/api/sites/${siteId}/departments`).then((res) => res.json()),
          fetch(`/api/sites/${siteId}/positions`).then((res) => res.json()),
        ]);

        setSite(siteRes);
        setDepartments(departmentsRes);
        setPositions(positionsRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  if (isLoading || !site) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <UsersList
      siteId={siteId}
      title="Site Users"
      sites={[site]}
      departments={departments}
      positions={positions}
    />
  );
}
