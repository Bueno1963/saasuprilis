
-- Tabela de configurações do laboratório (single row)
CREATE TABLE public.lab_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  technical_responsible text NOT NULL DEFAULT '',
  crm_responsible text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  logo_url text DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.lab_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lab_settings"
  ON public.lab_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update lab_settings"
  ON public.lab_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert lab_settings"
  ON public.lab_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.lab_settings (name) VALUES ('Meu Laboratório');

-- Tabela de equipamentos
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manufacturer text DEFAULT '',
  model text DEFAULT '',
  serial_number text DEFAULT '',
  sector text DEFAULT '',
  protocol text DEFAULT 'ASTM',
  status text NOT NULL DEFAULT 'active',
  last_maintenance timestamp with time zone,
  next_maintenance timestamp with time zone,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read equipment"
  ON public.equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert equipment"
  ON public.equipment FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update equipment"
  ON public.equipment FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete equipment"
  ON public.equipment FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Tabela de catálogo de exames
CREATE TABLE public.exam_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  material text DEFAULT 'Sangue',
  sector text DEFAULT 'Bioquímica',
  method text DEFAULT '',
  unit text DEFAULT '',
  reference_range text DEFAULT '',
  turnaround_hours integer DEFAULT 24,
  price numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read exam_catalog"
  ON public.exam_catalog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert exam_catalog"
  ON public.exam_catalog FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exam_catalog"
  ON public.exam_catalog FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exam_catalog"
  ON public.exam_catalog FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Tabela de convênios
CREATE TABLE public.insurance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text DEFAULT '',
  contact_name text DEFAULT '',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  billing_type text DEFAULT 'TUSS',
  payment_deadline_days integer DEFAULT 30,
  discount_percent numeric(5,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read insurance_plans"
  ON public.insurance_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert insurance_plans"
  ON public.insurance_plans FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update insurance_plans"
  ON public.insurance_plans FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete insurance_plans"
  ON public.insurance_plans FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Tabela de integrações
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'API',
  endpoint_url text DEFAULT '',
  api_key_name text DEFAULT '',
  protocol text DEFAULT 'REST',
  status text NOT NULL DEFAULT 'inactive',
  last_sync timestamp with time zone,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read integrations"
  ON public.integrations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert integrations"
  ON public.integrations FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update integrations"
  ON public.integrations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete integrations"
  ON public.integrations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Triggers de updated_at
CREATE TRIGGER update_lab_settings_updated_at BEFORE UPDATE ON public.lab_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_catalog_updated_at BEFORE UPDATE ON public.exam_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_plans_updated_at BEFORE UPDATE ON public.insurance_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
