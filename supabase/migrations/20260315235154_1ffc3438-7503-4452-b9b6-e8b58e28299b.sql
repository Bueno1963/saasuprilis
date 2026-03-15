
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_type text DEFAULT 'CRBM';

CREATE TABLE public.sector_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  sector text NOT NULL,
  signer_name text NOT NULL DEFAULT '',
  registration_type text NOT NULL DEFAULT 'CRBM',
  registration_number text NOT NULL DEFAULT '',
  signature_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sector)
);

ALTER TABLE public.sector_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage" ON public.sector_signers FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenant read" ON public.sector_signers FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER set_tenant_id_sector_signers BEFORE INSERT ON public.sector_signers
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER update_updated_at_sector_signers BEFORE UPDATE ON public.sector_signers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload signatures" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Public read signatures" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated update signatures" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated delete signatures" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'signatures');
