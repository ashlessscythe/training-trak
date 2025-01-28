"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Role, SOP } from "@prisma/client";

interface SOPFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    version: string;
    content?: string;
    requiredRoles: Role[];
    isActive?: boolean;
    id?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    description?: string;
    version: string;
    content?: string;
    requiredRoles: Role[];
    isActive: boolean;
  };
  onCancel: () => void;
}

export function SOPForm({ onSubmit, initialData, onCancel }: SOPFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    version: initialData?.version || "",
    content: initialData?.content || "",
    requiredRoles: initialData?.requiredRoles || [],
    isActive: initialData?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        id: initialData?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      requiredRoles: prev.requiredRoles.includes(role)
        ? prev.requiredRoles.filter((r) => r !== role)
        : [...prev.requiredRoles, role],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full p-2 border rounded-md h-24"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Version</label>
        <input
          type="text"
          required
          value={formData.version}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, version: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="e.g., 1.0.0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, content: e.target.value }))
          }
          className="w-full p-2 border rounded-md h-32"
          placeholder="SOP content or URL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Required Roles</label>
        <div className="space-y-2">
          {Object.values(Role).map((role) => (
            <label key={role} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requiredRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                {role
                  .split("_")
                  .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                  .join(" ")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {initialData && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update SOP"
            : "Create SOP"}
        </Button>
      </div>
    </form>
  );
}
