
-- ============================================================
-- FASE 1: INFRAESTRUTURA MULTI-TENANT SAAS
-- ============================================================

-- 1. Tabela tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#1e40af',
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  cnpj text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Laboratório Dra. Dielem Feijó', 'dra-dielem');

-- 2. Tabela tenant_members
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'tecnico',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);

INSERT INTO public.tenant_members (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, user_id, role
FROM public.user_roles ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 3. Funções
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  _tid := COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
  INSERT INTO public.tenant_members (tenant_id, user_id, role) VALUES (_tid, NEW.id, 'tecnico');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN NEW.tenant_id := get_user_tenant_id(auth.uid()); END IF;
  RETURN NEW;
END;
$$;

-- 4. Adicionar tenant_id + triggers a todas as tabelas operacionais
DO $$ DECLARE t text;
  tables text[] := ARRAY[
    'patients','orders','results','samples','appointments',
    'exam_catalog','exam_parameters','parameter_reference_ranges',
    'insurance_plans','insurance_plan_exams','billing_batches',
    'receivables','payables','equipment','maintenance_schedule',
    'certificates','pops','qc_data','sample_nonconformities',
    'sample_temperature_logs','sample_tracking_events',
    'integration_sync_logs','integrations','lab_settings',
    'accounting_entries','chart_of_accounts','portal_access_logs',
    'role_permissions','permission_audit_log'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET tenant_id = %L WHERE tenant_id IS NULL', t, '00000000-0000-0000-0000-000000000001');
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tid ON public.%I(tenant_id)', replace(t, '_', ''), t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_tid_%s ON public.%I', replace(t, '_', ''), t);
    EXECUTE format('CREATE TRIGGER trg_set_tid_%s BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id()', replace(t, '_', ''), t);
  END LOOP;
END $$;

-- 5. Drop ALL existing RLS policies on affected tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'patients','orders','results','samples','appointments',
      'exam_catalog','exam_parameters','parameter_reference_ranges',
      'insurance_plans','insurance_plan_exams','billing_batches',
      'receivables','payables','equipment','maintenance_schedule',
      'certificates','pops','qc_data','sample_nonconformities',
      'sample_temperature_logs','sample_tracking_events',
      'integration_sync_logs','integrations','lab_settings',
      'accounting_entries','chart_of_accounts','portal_access_logs',
      'role_permissions','permission_audit_log'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 6. Novas RLS policies

-- Tenants
CREATE POLICY "Members read own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin manage tenants" ON public.tenants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tenant Members
CREATE POLICY "Read own tenant members" ON public.tenant_members FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin manage members" ON public.tenant_members FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Group A: Full CRUD authenticated
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['patients','orders','results','appointments'] LOOP
    EXECUTE format('CREATE POLICY "Tenant isolation" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()))', t);
  END LOOP;
END $$;

-- Group B: Read/Insert/Update, no Delete
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['samples','sample_nonconformities'] LOOP
    EXECUTE format('CREATE POLICY "Tenant read" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Tenant insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Tenant update" ON public.%I FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
  END LOOP;
END $$;

-- Group C: Read/Insert only
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['qc_data','sample_temperature_logs','sample_tracking_events'] LOOP
    EXECUTE format('CREATE POLICY "Tenant read" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Tenant insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()))', t);
  END LOOP;
END $$;

-- Group D: Admin CUD + auth read
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['exam_catalog','exam_parameters','parameter_reference_ranges','insurance_plans','insurance_plan_exams','equipment','integrations','role_permissions'] LOOP
    EXECUTE format('CREATE POLICY "Tenant read" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admin update" ON public.%I FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admin delete" ON public.%I FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Group E: Admin only all
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['billing_batches','payables','receivables'] LOOP
    EXECUTE format('CREATE POLICY "Admin tenant access" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin'')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Group F: Admin+tecnico CU, admin delete, auth read
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['maintenance_schedule','certificates','pops'] LOOP
    EXECUTE format('CREATE POLICY "Tenant read" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin tecnico insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), ''admin'') OR has_role(auth.uid(), ''tecnico'')))', t);
    EXECUTE format('CREATE POLICY "Admin tecnico update" ON public.%I FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), ''admin'') OR has_role(auth.uid(), ''tecnico'')))', t);
    EXECUTE format('CREATE POLICY "Admin delete" ON public.%I FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Group G: Admin manage + auth read
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['accounting_entries','chart_of_accounts'] LOOP
    EXECUTE format('CREATE POLICY "Tenant read" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Admin manage" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin'')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Special: lab_settings
CREATE POLICY "Tenant read" ON public.lab_settings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.lab_settings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.lab_settings FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Special: integration_sync_logs
CREATE POLICY "Tenant read" ON public.integration_sync_logs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admin insert" ON public.integration_sync_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete" ON public.integration_sync_logs FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Special: portal_access_logs
CREATE POLICY "Admin read" ON public.portal_access_logs FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Service insert" ON public.portal_access_logs FOR INSERT TO public
  WITH CHECK (true);

-- Special: permission_audit_log
CREATE POLICY "Admin read" ON public.permission_audit_log FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert" ON public.permission_audit_log FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
