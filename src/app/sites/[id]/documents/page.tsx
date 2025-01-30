"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, DocumentType, SOP } from "@prisma/client";
import { DocumentDialog } from "@/components/document-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentMetadata {
  description?: string;
  category?: string;
  tags?: string[];
  version?: string;
}

type DocumentWithUploader = Document & {
  uploadedBy: {
    name: string;
    siteId: string;
  };
  metadata: DocumentMetadata;
  sop?: {
    id: string;
    name: string;
    version: string;
  };
};

export default function SiteDocumentsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [documents, setDocuments] = useState<DocumentWithUploader[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sops, setSops] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    Document | undefined
  >();
  const [siteName, setSiteName] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "ALL">("ALL");
  const [sopFilter, setSopFilter] = useState<string | "ALL">("ALL");
  const [metadataFilter, setMetadataFilter] = useState<
    "ALL" | "WITH" | "WITHOUT"
  >("ALL");
  const [sortBy, setSortBy] = useState<"name" | "date" | "uploader">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [documentsRes, sopsRes, siteRes] = await Promise.all([
          fetch(`/api/sites/${siteId}/documents`).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || "Failed to fetch documents");
            }
            return res.json();
          }),
          fetch("/api/sops").then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || "Failed to fetch SOPs");
            }
            return res.json();
          }),
          fetch(`/api/sites/${siteId}`).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || "Failed to fetch site details");
            }
            return res.json();
          }),
        ]);

        // Validate responses
        if (!Array.isArray(documentsRes)) {
          throw new Error("Invalid documents response format");
        }
        if (!Array.isArray(sopsRes)) {
          throw new Error("Invalid SOPs response format");
        }
        if (!siteRes?.name) {
          throw new Error("Invalid site response format");
        }

        setDocuments(documentsRes);
        setSops(sopsRes);
        setSiteName(siteRes.name);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleCreateDocument = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("name", data.name);
      formData.append("type", "OTHER");
      formData.append("metadata", JSON.stringify(data.metadata || {}));
      if (data.sopId) formData.append("sopId", data.sopId);

      const response = await fetch(`/api/sites/${siteId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create document");
      }

      const newDocument = await response.json();
      setDocuments((prev) => [...prev, newDocument]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateDocument = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("id", data.id);
      if (data.content) formData.append("content", data.content);
      formData.append("name", data.name);
      formData.append("type", "OTHER");
      formData.append("metadata", JSON.stringify(data.metadata || {}));
      if (data.sopId) formData.append("sopId", data.sopId);

      const response = await fetch(`/api/sites/${siteId}/documents`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update document");
      }

      const updatedDocument = await response.json();
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === updatedDocument.id ? updatedDocument : doc
        )
      );
      setIsDialogOpen(false);
      setSelectedDocument(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(
        `/api/sites/${siteId}/documents?id=${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDownloadDocument = async (
    documentId: string,
    fileName: string
  ) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Documents - {siteName}</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Upload Document</Button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as DocumentType | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SOP_ATTACHMENT">SOP Attachment</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sopFilter}
            onValueChange={(value) => setSopFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by SOP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All SOPs</SelectItem>
              <SelectItem value="NONE">No SOP</SelectItem>
              {sops.map((sop) => (
                <SelectItem key={sop.id} value={sop.id}>
                  {sop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={metadataFilter}
            onValueChange={(value) =>
              setMetadataFilter(value as "ALL" | "WITH" | "WITHOUT")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by metadata" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Documents</SelectItem>
              <SelectItem value="WITH">With Metadata</SelectItem>
              <SelectItem value="WITHOUT">Without Metadata</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "name" | "date" | "uploader")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Upload Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="uploader">Uploader</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {documents
          .filter((doc) => {
            if (typeFilter === "ALL") return true;
            return doc.type === typeFilter;
          })
          .filter((doc) => {
            if (sopFilter === "ALL") return true;
            if (sopFilter === "NONE") return !doc.sop;
            return doc.sop?.id === sopFilter;
          })
          .filter((doc) => {
            if (metadataFilter === "ALL") return true;
            const hasMetadata =
              doc.metadata && Object.keys(doc.metadata).length > 0;
            return metadataFilter === "WITH" ? hasMetadata : !hasMetadata;
          })
          .sort((a, b) => {
            switch (sortBy) {
              case "name":
                return sortOrder === "asc"
                  ? a.name.localeCompare(b.name)
                  : b.name.localeCompare(a.name);
              case "uploader":
                return sortOrder === "asc"
                  ? a.uploadedBy.name.localeCompare(b.uploadedBy.name)
                  : b.uploadedBy.name.localeCompare(a.uploadedBy.name);
              case "date":
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
              default:
                return 0;
            }
          })
          .map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{doc.name}</h3>
                  {doc.metadata && (
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      {doc.metadata.description && (
                        <p>{doc.metadata.description}</p>
                      )}
                      <div className="flex gap-2">
                        {doc.metadata.category && (
                          <span>Category: {doc.metadata.category}</span>
                        )}
                        {doc.metadata.version && (
                          <span>Version: {doc.metadata.version}</span>
                        )}
                      </div>
                      {doc.metadata.tags && doc.metadata.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {doc.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Uploaded by {doc.uploadedBy.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDocument(doc);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc.id, doc.name)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        {documents.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No documents found for this site.
          </p>
        )}
      </div>

      <DocumentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDocument(undefined);
        }}
        onSubmit={
          selectedDocument ? handleUpdateDocument : handleCreateDocument
        }
        sops={sops}
        document={selectedDocument}
        title={selectedDocument ? "Edit Document" : "Upload Document"}
      />
    </div>
  );
}
