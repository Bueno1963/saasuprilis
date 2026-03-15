
CREATE TABLE public.integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  lis_field TEXT NOT NULL DEFAULT '',
  remote_field TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.integration_field_mappings FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.integration_field_mappings FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update" ON public.integration_field_mappings FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete" ON public.integration_field_mappings FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_integration_field_mappings BEFORE INSERT ON public.integration_field_mappings FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER update_updated_at_integration_field_mappings BEFORE UPDATE ON public.integration_field_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
