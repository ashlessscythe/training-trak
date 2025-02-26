"use client";

import { useEffect, useState } from "react";
import { SOP, Site } from "@prisma/client";
import { DocumentsList } from "@/components/documents-list";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DocumentsPage() {
  const [sops, setSops] = useState<SOP[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch SOPs when site is selected
  useEffect(() => {
    const fetchSOPs = async () => {
      if (!selectedSite) {
        setSops([]);
        return;
      }

      try {
        const response = await fetch(`/api/sites/${selectedSite}/sops`);
        const data = await response.json();
        setSops(data);
      } catch (error) {
        console.error("Failed to fetch SOPs:", error);
      }
    };

    fetchSOPs();
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
              Please select a site to view documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <DocumentsList sops={sops} siteId={selectedSite} />
      )}
    </div>
  );
}
