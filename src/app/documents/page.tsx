"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type DocumentWithRelations = Document & {
  uploadedBy: {
    name: string;
    email: string;
  };
  sop?: {
    id: string;
    name: string;
    version: string;
  };
};

function formatDocumentType(type: DocumentType) {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    Document | undefined
  >();
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
        const [documentsRes, sopsRes] = await Promise.all([
          fetch("/api/documents").then((res) => res.json()),
          fetch("/api/sops").then((res) => res.json()),
        ]);
        setDocuments(documentsRes);
        setSops(sopsRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateDocument = async (data: any) => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      const response = await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
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

      <div className="grid gap-6">
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
          .map((document) => (
            <Card key={document.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{document.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDocumentType(document.type)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(document);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">URL:</dt>
                        <dd className="inline ml-1">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {document.url}
                          </a>
                        </dd>
                      </div>
                      {document.sop && (
                        <div>
                          <dt className="inline text-muted-foreground">SOP:</dt>
                          <dd className="inline ml-1">
                            {document.sop.name} (v{document.sop.version})
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="inline text-muted-foreground">
                          Uploaded by:
                        </dt>
                        <dd className="inline ml-1">
                          {document.uploadedBy.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Upload date:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {document.metadata &&
                    Object.keys(document.metadata).length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Metadata</h3>
                        <dl className="space-y-1 text-sm">
                          {Object.entries(document.metadata).map(
                            ([key, value]) => (
                              <div key={key}>
                                <dt className="inline text-muted-foreground">
                                  {key}:
                                </dt>
                                <dd className="inline ml-1">{String(value)}</dd>
                              </div>
                            )
                          )}
                        </dl>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
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
