import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TenantBranding {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  slug: string;
}

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function generateForeground(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 100%";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0% 10%" : "0 0% 100%";
}

export const useTenantBranding = () => {
  const { user } = useAuth();

  const { data: branding, isLoading } = useQuery({
    queryKey: ["tenant_branding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Get tenant via tenant_members
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (!membership) return null;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("name, logo_url, primary_color, slug")
        .eq("id", membership.tenant_id)
        .single();

      return tenant as TenantBranding | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Apply dynamic CSS variables based on tenant primary_color
  useEffect(() => {
    if (!branding?.primary_color) return;
    const hsl = hexToHsl(branding.primary_color);
    if (!hsl) return;
    const fg = generateForeground(branding.primary_color);
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--primary-foreground", fg);

    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
    };
  }, [branding?.primary_color]);

  return { branding, isLoading };
};
