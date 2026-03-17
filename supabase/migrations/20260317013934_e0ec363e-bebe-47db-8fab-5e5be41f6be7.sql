
CREATE TABLE public.qc_daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  sector text NOT NULL DEFAULT '',
  sheet_type text NOT NULL DEFAULT '',
  parameter_name text NOT NULL,
  day integer NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  value text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sector, sheet_type, parameter_name, day, month, year)
);

ALTER TABLE public.qc_daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.qc_daily_entries FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant insert" ON public.qc_daily_entries FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant update" ON public.qc_daily_entries FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant delete" ON public.qc_daily_entries FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER set_tenant_id_qc_daily_entries
  BEFORE INSERT ON public.qc_daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER update_updated_at_qc_daily_entries
  BEFORE UPDATE ON public.qc_daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
