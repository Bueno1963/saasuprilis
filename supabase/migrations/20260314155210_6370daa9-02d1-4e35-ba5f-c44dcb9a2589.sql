
CREATE TABLE public.report_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exam_catalog(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id),
  hide_reference_range boolean NOT NULL DEFAULT false,
  hide_flag boolean NOT NULL DEFAULT false,
  hide_unit boolean NOT NULL DEFAULT false,
  header_text text DEFAULT '',
  footer_text text DEFAULT '',
  default_observations text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, tenant_id)
);

ALTER TABLE public.report_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.report_layouts FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admin insert" ON public.report_layouts FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update" ON public.report_layouts FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete" ON public.report_layouts FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_report_layouts_tenant_id BEFORE INSERT ON public.report_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER update_report_layouts_updated_at BEFORE UPDATE ON public.report_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
