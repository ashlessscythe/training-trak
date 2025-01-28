"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, DocumentType, SOP } from "@prisma/client";
import { DocumentDialog } from "@/components/document-dialog";

type DocumentWithRelations = Document & {
  uploadedBy: {
    name: string;
    email: string;
  };
  sop?: {
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

      setIsDialogOpen(false);
      window.location.reload();
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

      setIsDialogOpen(false);
      setSelectedDocument(undefined);
      window.location.reload();
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

      window.location.reload();
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

      <div className="grid gap-6">
        {documents.map((document) => (
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
