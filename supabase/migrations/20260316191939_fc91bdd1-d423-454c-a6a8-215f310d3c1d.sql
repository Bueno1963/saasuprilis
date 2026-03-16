
CREATE TABLE public.integration_protocol_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_by uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_protocol_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.integration_protocol_bank FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admin manage" ON public.integration_protocol_bank FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_tenant_id_protocol_bank BEFORE INSERT ON public.integration_protocol_bank
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER update_updated_at_protocol_bank BEFORE UPDATE ON public.integration_protocol_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('protocol-bank', 'protocol-bank', true);

CREATE POLICY "Protocol bank upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'protocol-bank');

CREATE POLICY "Protocol bank read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'protocol-bank');

CREATE POLICY "Protocol bank delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'protocol-bank');
