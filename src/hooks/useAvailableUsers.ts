import { useEffect, useState } from "react";
import { User } from "@prisma/client";

interface UseAvailableUsersOptions {
  siteId: string;
}

export function useAvailableUsers({ siteId }: UseAvailableUsersOptions) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/users`);
        const data = await response.json();
        setUsers(data.filter((user: User) => user.isActive));
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [siteId]);

  return { users, isLoading };
}
