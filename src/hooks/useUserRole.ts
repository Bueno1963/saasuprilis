import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { AppRole } from "@/lib/navigation";

export const useUserRole = (): { role: AppRole; isLoading: boolean } => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user_role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as AppRole) ?? "tecnico";
    },
  });

  return { role: role ?? "tecnico", isLoading };
};
