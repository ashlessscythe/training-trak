"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stackServerApp } from "@/stack";
import { handleUserApproval } from "@/lib/stack-auth-integration";
import { useUser } from "@stackframe/stack";

interface PendingUser {
  id: string;
  email: string;
  name: string;
  registeredAt: string;
}

interface Site {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  siteId: string;
}

interface Position {
  id: string;
  name: string;
  siteId: string;
}

export default function AdminUserApproval() {
  const user = useUser({ or: "redirect" });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  // Form state for each user
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {}
  );
  const [selectedSites, setSelectedSites] = useState<Record<string, string>>(
    {}
  );
  const [selectedDepartments, setSelectedDepartments] = useState<
    Record<string, string>
  >({});
  const [selectedPositions, setSelectedPositions] = useState<
    Record<string, string>
  >({});

  // Fetch pending users and reference data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all Stack Auth users
        const allUsers = await fetch("/api/admin/stack-users").then((res) =>
          res.json()
        );

        // Filter for pending users
        const pending = allUsers
          .filter((u: any) => u.clientReadOnlyMetadata?.status === "PENDING")
          .map((u: any) => ({
            id: u.id,
            email: u.primaryEmail,
            name: u.displayName || u.primaryEmail?.split("@")[0] || "User",
            registeredAt:
              u.clientReadOnlyMetadata?.registeredAt ||
              new Date().toISOString(),
          }));

        setPendingUsers(pending);

        // Fetch sites, departments, and positions
        const sitesData = await fetch("/api/sites").then((res) => res.json());
        const deptsData = await fetch("/api/departments").then((res) =>
          res.json()
        );
        const positionsData = await fetch("/api/positions").then((res) =>
          res.json()
        );

        setSites(sitesData);
        setDepartments(deptsData);
        setPositions(positionsData);

        // Initialize form state for each user
        const roles: Record<string, string> = {};
        const userSites: Record<string, string> = {};
        const userDepts: Record<string, string> = {};
        const userPositions: Record<string, string> = {};

        pending.forEach((user: PendingUser) => {
          roles[user.id] = "USER"; // Default role
          if (sitesData.length > 0) {
            userSites[user.id] = sitesData[0].id;
          }
        });

        setSelectedRoles(roles);
        setSelectedSites(userSites);
        setSelectedDepartments(userDepts);
        setSelectedPositions(userPositions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Update available departments when site changes
  useEffect(() => {
    // For each user, update their department options based on selected site
    const userDepts: Record<string, string> = {};

    Object.entries(selectedSites).forEach(([userId, siteId]) => {
      const siteDepts = departments.filter((d) => d.siteId === siteId);
      if (siteDepts.length > 0) {
        userDepts[userId] = siteDepts[0].id;
      }
    });

    setSelectedDepartments(userDepts);
  }, [selectedSites, departments]);

  // Update available positions when site changes
  useEffect(() => {
    // For each user, update their position options based on selected site
    const userPositions: Record<string, string> = {};

    Object.entries(selectedSites).forEach(([userId, siteId]) => {
      const sitePositions = positions.filter((p) => p.siteId === siteId);
      if (sitePositions.length > 0) {
        userPositions[userId] = sitePositions[0].id;
      }
    });

    setSelectedPositions(userPositions);
  }, [selectedSites, positions]);

  // Handle role change
  const handleRoleChange = (userId: string, role: string) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: role,
    }));
  };

  // Handle site change
  const handleSiteChange = (userId: string, siteId: string) => {
    setSelectedSites((prev) => ({
      ...prev,
      [userId]: siteId,
    }));
  };

  // Handle department change
  const handleDepartmentChange = (userId: string, deptId: string) => {
    setSelectedDepartments((prev) => ({
      ...prev,
      [userId]: deptId,
    }));
  };

  // Handle position change
  const handlePositionChange = (userId: string, positionId: string) => {
    setSelectedPositions((prev) => ({
      ...prev,
      [userId]: positionId,
    }));
  };

  // Approve user
  const approveUser = async (userId: string) => {
    try {
      setApproving(true);

      const role = selectedRoles[userId];
      const siteId = selectedSites[userId];
      const departmentId = selectedDepartments[userId];
      const positionId = selectedPositions[userId];

      if (!role || !siteId || !departmentId || !positionId) {
        alert("Please select all required fields");
        return;
      }

      // Call API to approve user
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role,
          siteId,
          departmentId,
          positionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      // Remove user from pending list
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));

      alert("User approved successfully");
    } catch (error) {
      console.error("Error approving user:", error);
      alert(`Error approving user: ${(error as Error).message}`);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading pending users...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Pending User Approvals</h1>

      {pendingUsers.length === 0 ? (
        <p>No pending users to approve</p>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>{pendingUser.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Registered:{" "}
                    {new Date(pendingUser.registeredAt).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <div className="p-2 border rounded bg-muted">
                      {pendingUser.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedRoles[pendingUser.id] || ""}
                      onChange={(e) =>
                        handleRoleChange(pendingUser.id, e.target.value)
                      }
                    >
                      <option value="USER">User</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="SITE_ADMIN">Site Admin</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Site
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedSites[pendingUser.id] || ""}
                      onChange={(e) =>
                        handleSiteChange(pendingUser.id, e.target.value)
                      }
                    >
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Department
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedDepartments[pendingUser.id] || ""}
                      onChange={(e) =>
                        handleDepartmentChange(pendingUser.id, e.target.value)
                      }
                      disabled={!selectedSites[pendingUser.id]}
                    >
                      {departments
                        .filter(
                          (dept) =>
                            dept.siteId === selectedSites[pendingUser.id]
                        )
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Position
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedPositions[pendingUser.id] || ""}
                      onChange={(e) =>
                        handlePositionChange(pendingUser.id, e.target.value)
                      }
                      disabled={!selectedSites[pendingUser.id]}
                    >
                      {positions
                        .filter(
                          (pos) => pos.siteId === selectedSites[pendingUser.id]
                        )
                        .map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => approveUser(pendingUser.id)}
                    disabled={approving}
                  >
                    {approving ? "Approving..." : "Approve User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
