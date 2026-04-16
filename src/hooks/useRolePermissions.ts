import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import type { AppRole } from "@/lib/navigation";

export interface RolePermission {
  role: AppRole;
  route: string;
  allowed: boolean;
}

/** Returns allowed routes for the current user's role */
export const useRolePermissions = () => {
  const { role } = useUserRole();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role_permissions", role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, route, allowed")
        .eq("role", role);
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  const allowedRoutes = new Set(
    permissions.filter(p => p.allowed).map(p => p.route)
  );

  const isRouteAllowed = (route: string) => {
    if (role === "super_admin" || role === "admin") return true;
    // Recepcao always has access to /recepcao
    if (role === "recepcao" && route === "/recepcao") return true;
    if (permissions.length === 0) return false;
    return allowedRoutes.has(route);
  };

  return { permissions, isRouteAllowed, allowedRoutes, isLoading };
};

/** Returns all permissions for all roles (admin use) */
export const useAllRolePermissions = () => {
  return useQuery({
    queryKey: ["all_role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role")
        .order("route");
      if (error) throw error;
      return data;
    },
  });
};
