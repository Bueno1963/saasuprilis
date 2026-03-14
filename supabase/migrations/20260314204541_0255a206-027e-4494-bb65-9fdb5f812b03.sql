
-- QC Analyte configurations (target mean, SD, levels)
CREATE TABLE public.qc_analyte_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyte_name text NOT NULL,
  equipment text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'N1',
  lot_number text NOT NULL DEFAULT '',
  target_mean numeric NOT NULL DEFAULT 0,
  target_sd numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qc_analyte_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.qc_analyte_configs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.qc_analyte_configs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update" ON public.qc_analyte_configs FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete" ON public.qc_analyte_configs FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_qc_analyte_configs BEFORE INSERT ON public.qc_analyte_configs
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER update_updated_at_qc_analyte_configs BEFORE UPDATE ON public.qc_analyte_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Westgard rules configuration
CREATE TABLE public.qc_westgard_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL,
  rule_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  rule_type text NOT NULL DEFAULT 'warning',
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qc_westgard_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.qc_westgard_rules FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.qc_westgard_rules FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update" ON public.qc_westgard_rules FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete" ON public.qc_westgard_rules FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_qc_westgard_rules BEFORE INSERT ON public.qc_westgard_rules
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER update_updated_at_qc_westgard_rules BEFORE UPDATE ON public.qc_westgard_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- QC Control lots
CREATE TABLE public.qc_control_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number text NOT NULL,
  manufacturer text NOT NULL DEFAULT '',
  analyte_name text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'N1',
  expected_mean numeric NOT NULL DEFAULT 0,
  expected_sd numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  expiry_date date,
  opened_at date,
  status text NOT NULL DEFAULT 'vigente',
  notes text DEFAULT '',
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qc_control_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.qc_control_lots FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.qc_control_lots FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update" ON public.qc_control_lots FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete" ON public.qc_control_lots FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_qc_control_lots BEFORE INSERT ON public.qc_control_lots
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER update_updated_at_qc_control_lots BEFORE UPDATE ON public.qc_control_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
