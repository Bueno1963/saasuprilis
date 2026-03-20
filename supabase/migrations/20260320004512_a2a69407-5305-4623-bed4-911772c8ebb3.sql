
CREATE TABLE public.sample_condition_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  condition_value TEXT NOT NULL,
  condition_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sample_condition_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.sample_condition_options
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admin insert" ON public.sample_condition_options
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update" ON public.sample_condition_options
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete" ON public.sample_condition_options
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_sample_condition_options
  BEFORE INSERT ON public.sample_condition_options
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
