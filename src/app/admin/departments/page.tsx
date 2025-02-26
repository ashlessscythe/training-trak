"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Department, Site } from "@prisma/client";
import { DepartmentDialog } from "@/components/department-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<
    Department | undefined
  >();
  const [nameFilter, setNameFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      }
    };
    fetchSites();
  }, []);

  // Fetch departments when site is selected
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSite) {
        setDepartments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/sites/${selectedSite}/departments`);
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedSite]);

  const handleCreateDepartment = async (data: any) => {
    if (!selectedSite) {
      alert("Please select a site first");
      return;
    }

    try {
      const response = await fetch(`/api/sites/${selectedSite}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create department");
      }

      const newDepartment = await response.json();
      setDepartments((prev) => [...prev, newDepartment]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateDepartment = async (data: any) => {
    if (!selectedSite) {
      alert("Please select a site first");
      return;
    }

    try {
      const response = await fetch(`/api/sites/${selectedSite}/departments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update department");
      }

      const updatedDepartment = await response.json();
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === updatedDepartment.id ? updatedDepartment : dept
        )
      );
      setIsDialogOpen(false);
      setSelectedDepartment(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!selectedSite) {
      alert("Please select a site first");
      return;
    }

    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const response = await fetch(
        `/api/sites/${selectedSite}/departments?id=${departmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete department");
      }

      setDepartments((prev) => prev.filter((dept) => dept.id !== departmentId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredAndSortedDepartments = useMemo(() => {
    let filtered = [...departments];

    // Apply name filter
    if (nameFilter) {
      filtered = filtered.filter((department) =>
        department.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [departments, nameFilter, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Departments</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNameFilter("");
                setSortBy("name");
                setSortOrder("asc");
              }}
            >
              Clear Filters
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!selectedSite}
            >
              Create Department
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger>
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

          <Input
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNameFilter(e.target.value)
            }
          />

          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value: "name" | "createdAt") => setSortBy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-4"></div>

      {!selectedSite ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Please select a site to view departments
            </p>
          </CardContent>
        </Card>
      ) : Array.isArray(filteredAndSortedDepartments) &&
        filteredAndSortedDepartments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDepartments.map((department) => (
            <Card key={department.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{department.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDepartment(department);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {department.description || "No description provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created:{" "}
                    {new Date(department.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No departments found
            </p>
          </CardContent>
        </Card>
      )}

      <DepartmentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDepartment(undefined);
        }}
        onSubmit={
          selectedDepartment ? handleUpdateDepartment : handleCreateDepartment
        }
        department={selectedDepartment}
        title={selectedDepartment ? "Edit Department" : "Create Department"}
        siteId={selectedSite}
      />
    </div>
  );
}
