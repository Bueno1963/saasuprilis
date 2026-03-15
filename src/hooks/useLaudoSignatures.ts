import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { SectorSigner } from "@/lib/generate-laudo-pdf";

interface LaudoSignatureData {
  logoUrl?: string;
  sectorSigners: SectorSigner[];
}

export const useLaudoSignatures = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["laudo_signatures", user?.id],
    queryFn: async (): Promise<LaudoSignatureData> => {
      if (!user) return { sectorSigners: [] };

      // Get tenant for logo
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      let logoUrl: string | undefined;
      if (membership) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("logo_url")
          .eq("id", membership.tenant_id)
          .single();
        if (tenant?.logo_url) logoUrl = tenant.logo_url;
      }

      // Get sector signers
      const { data: signers } = await supabase
        .from("sector_signers" as any)
        .select("sector, signer_name, registration_type, registration_number, signature_url");

      return {
        logoUrl,
        sectorSigners: (signers || []) as unknown as SectorSigner[],
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    logoUrl: data?.logoUrl,
    sectorSigners: data?.sectorSigners || [],
    isLoading,
  };
};
