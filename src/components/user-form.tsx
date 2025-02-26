import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Role, Site, Department, Position } from "@prisma/client";

interface UserFormProps {
  sites: Site[];
  departments: Department[];
  positions: Position[];
  onSubmit: (data: {
    email: string;
    name: string;
    password?: string;
    role: Role;
    siteId: string;
    departmentId: string;
    positionId: string;
    isActive?: boolean;
    id?: string;
    shift?: string;
    ssoId?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    email: string;
    name: string;
    role: Role;
    siteId: string;
    departmentId: string;
    positionId: string;
    isActive: boolean;
    shift?: string;
    ssoId?: string;
  };
  onCancel: () => void;
  onSiteChange?: (siteId: string) => Promise<void>;
}

export function UserForm({
  sites,
  departments,
  positions,
  onSubmit,
  initialData,
  onCancel,
  onSiteChange,
}: UserFormProps) {
  const [formData, setFormData] = useState({
    email: initialData?.email || "",
    name: initialData?.name || "",
    password: "",
    role: initialData?.role || Role.USER,
    siteId: initialData?.siteId || "",
    departmentId: initialData?.departmentId || "",
    positionId: initialData?.positionId || "",
    isActive: initialData?.isActive ?? true,
    shift: initialData?.shift || "FIRST",
    ssoId: initialData?.ssoId || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        id: initialData?.id,
        // Only include password if it's provided or if it's a new user
        password: formData.password || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        />
      </div>

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
        <label className="block text-sm font-medium mb-1">
          {initialData ? "New Password (optional)" : "Password"}
        </label>
        <input
          type="password"
          required={!initialData}
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          required
          value={formData.role}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, role: e.target.value as Role }))
          }
          className="w-full p-2 border rounded-md"
        >
          {Object.values(Role).map((role) => (
            <option key={role} value={role}>
              {role
                .split("_")
                .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                .join(" ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Site</label>
        <select
          required
          value={formData.siteId}
          onChange={async (e) => {
            const newSiteId = e.target.value;
            setFormData((prev) => ({
              ...prev,
              siteId: newSiteId,
              departmentId: "",
              positionId: "",
            }));

            // Call the onSiteChange callback if provided
            if (onSiteChange && newSiteId) {
              await onSiteChange(newSiteId);
            }
          }}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <select
          required
          value={formData.departmentId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, departmentId: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a department</option>
          {departments
            .filter((dept) => dept.siteId === formData.siteId)
            .map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Position</label>
        <select
          required
          value={formData.positionId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, positionId: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a position</option>
          {positions
            .filter((pos) => pos.siteId === formData.siteId)
            .map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Shift</label>
        <select
          value={formData.shift}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, shift: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        >
          <option value="FIRST">First Shift</option>
          <option value="SECOND">Second Shift</option>
          <option value="THIRD">Third Shift</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          SSO ID (Optional)
        </label>
        <input
          type="text"
          value={formData.ssoId || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ssoId: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        />
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
            ? "Update User"
            : "Create User"}
        </Button>
      </div>
    </form>
  );
}
