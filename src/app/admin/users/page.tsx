"use client";

import { useEffect, useState } from "react";
import { Site, Role, Department, Position } from "@prisma/client";
import { UsersList } from "@/components/features/users/users-list";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [roles, setRoles] = useState<Role[]>(Object.values(Role));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sites, departments, and positions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Always fetch all sites
        const sitesResponse = await fetch("/api/sites");
        const sitesData = await sitesResponse.json();
        setSites(sitesData);

        if (!selectedSite) {
          // Fetch all departments and positions when no site is selected
          const [allDepartmentsRes, allPositionsRes] = await Promise.all([
            fetch(`/api/departments`).then((res) => res.json()),
            fetch(`/api/positions`).then((res) => res.json()),
          ]);

          setDepartments(allDepartmentsRes);
          setPositions(allPositionsRes);
        } else {
          // Fetch departments and positions for the selected site
          const [departmentsRes, positionsRes] = await Promise.all([
            fetch(`/api/sites/${selectedSite}/departments`).then((res) =>
              res.json()
            ),
            fetch(`/api/sites/${selectedSite}/positions`).then((res) =>
              res.json()
            ),
          ]);

          setDepartments(departmentsRes);
          setPositions(positionsRes);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSite]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSite ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Please select a site to view users
            </p>
          </CardContent>
        </Card>
      ) : (
        <UsersList
          sites={sites}
          roles={roles}
          departments={departments}
          positions={positions}
          siteId={selectedSite}
        />
      )}
    </div>
  );
}
