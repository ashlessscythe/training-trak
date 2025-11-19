import { useState, useEffect, useCallback } from "react";
import { SiteResponse } from "@/types/api";

export function useSites() {
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/sites");
      
      if (!response.ok) {
        throw new Error("Failed to fetch sites");
      }

      const data = await response.json();
      setSites(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const createSite = async (siteData: any) => {
    const response = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create site");
    }

    const newSite = await response.json();
    setSites((prev) => [...prev, newSite]);
    return newSite;
  };

  const updateSite = async (siteData: any) => {
    const response = await fetch("/api/sites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update site");
    }

    const updatedSite = await response.json();
    setSites((prev) =>
      prev.map((site) => (site.id === updatedSite.id ? updatedSite : site))
    );
    return updatedSite;
  };

  const deleteSite = async (id: string) => {
    const response = await fetch(`/api/sites?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete site");
    }

    setSites((prev) => prev.filter((site) => site.id !== id));
  };

  return {
    sites,
    loading,
    error,
    refetch: fetchSites,
    createSite,
    updateSite,
    deleteSite,
  };
}

export function useSite(siteId: string) {
  const [site, setSite] = useState<SiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSite = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sites/${siteId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch site");
      }

      const data = await response.json();
      setSite(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId, fetchSite]);

  return {
    site,
    loading,
    error,
    refetch: fetchSite,
  };
}
