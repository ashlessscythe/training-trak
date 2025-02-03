"use client";

import { useEffect, useState } from "react";
import { Site, Department, Position } from "@prisma/client";
import { UsersList } from "@/components/users-list";

export default function UsersPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesRes, departmentsRes, positionsRes] = await Promise.all([
          fetch("/api/sites").then((res) => res.json()),
          fetch("/api/departments").then((res) => res.json()),
          fetch("/api/positions").then((res) => res.json()),
        ]);

        setSites(sitesRes);
        setDepartments(departmentsRes);
        setPositions(positionsRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <UsersList sites={sites} departments={departments} positions={positions} />
  );
}
