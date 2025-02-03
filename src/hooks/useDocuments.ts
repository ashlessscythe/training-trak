import { Document, DocumentType, SOP } from "@prisma/client";
import { useResourceList } from "./useResourceList";

interface DocumentFilters {
  type: DocumentType | "ALL";
  sop: string | "ALL" | "NONE";
  metadata: "ALL" | "WITH" | "WITHOUT";
}

type DocumentWithRelations = Document & {
  uploadedBy: {
    name: string;
    email?: string;
    siteId?: string;
  };
  sop?: {
    id: string;
    name: string;
    version: string;
  };
  metadata: Record<string, any>;
};

interface UseDocumentsOptions {
  siteId?: string;
  sops: SOP[];
}

export function useDocuments({ siteId, sops }: UseDocumentsOptions) {
  const baseUrl = siteId ? `/api/sites/${siteId}/documents` : "/api/documents";

  const filterConfig = {
    type: {
      predicate: (doc: DocumentWithRelations, value: DocumentType | "ALL") =>
        value === "ALL" || doc.type === value,
    },
    sop: {
      predicate: (
        doc: DocumentWithRelations,
        value: string | "ALL" | "NONE"
      ) => {
        if (value === "ALL") return true;
        if (value === "NONE") return !doc.sop;
        return doc.sop?.id === value;
      },
    },
    metadata: {
      predicate: (
        doc: DocumentWithRelations,
        value: "ALL" | "WITH" | "WITHOUT"
      ) => {
        if (value === "ALL") return true;
        const hasMetadata =
          doc.metadata && Object.keys(doc.metadata).length > 0;
        return value === "WITH" ? hasMetadata : !hasMetadata;
      },
    },
  };

  const {
    resources: documents,
    isLoading,
    isDialogOpen,
    selectedResource: selectedDocument,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedResource: setSelectedDocument,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchResources: fetchDocuments,
    handleCreateResource: handleCreate,
    handleUpdateResource: handleUpdate,
    handleDeleteResource: handleDelete,
  } = useResourceList<DocumentWithRelations, DocumentFilters>({
    fetchUrl: baseUrl,
    filterOptions: [
      {
        key: "type",
        value: "ALL",
        predicate: filterConfig.type.predicate,
      },
      {
        key: "sop",
        value: "ALL",
        predicate: filterConfig.sop.predicate,
      },
      {
        key: "metadata",
        value: "ALL",
        predicate: filterConfig.metadata.predicate,
      },
    ],
    sortOptions: [
      {
        key: "date",
        getValue: (doc) => new Date(doc.createdAt),
      },
      {
        key: "name",
        getValue: (doc) => doc.name,
      },
      {
        key: "uploader",
        getValue: (doc) => doc.uploadedBy.name,
      },
    ],
    onCreateResource: async (data) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("name", data.name);
      formData.append("type", data.type);
      formData.append("metadata", JSON.stringify(data.metadata || {}));
      if (data.sopId) formData.append("sopId", data.sopId);

      const response = await fetch(baseUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create document");
      }
    },
    onUpdateResource: async (data) => {
      const formData = new FormData();
      formData.append("id", data.id);
      if (data.content) formData.append("content", data.content);
      formData.append("name", data.name);
      formData.append("type", data.type);
      formData.append("metadata", JSON.stringify(data.metadata || {}));
      if (data.sopId) formData.append("sopId", data.sopId);

      const response = await fetch(baseUrl, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update document");
      }
    },
    onDeleteResource: async (id) => {
      const response = await fetch(`${baseUrl}?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete document");
      }
    },
  });

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

  return {
    documents,
    isLoading,
    isDialogOpen,
    selectedDocument,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedDocument,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchDocuments,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDownloadDocument,
    sops,
  };
}
