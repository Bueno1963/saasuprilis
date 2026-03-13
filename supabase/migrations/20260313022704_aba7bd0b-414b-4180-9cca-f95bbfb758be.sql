
-- Tabela de certificados (calibração, treinamento, acreditação, etc.)
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'calibracao',
  issuer text DEFAULT '',
  certificate_number text DEFAULT '',
  issue_date date,
  expiry_date date,
  related_equipment text DEFAULT '',
  related_employee text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'vigente',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read certificates"
  ON public.certificates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and tecnicos can insert certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admins and tecnicos can update certificates"
  ON public.certificates FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admins can delete certificates"
  ON public.certificates FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket para arquivos de certificados
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates');

CREATE POLICY "Admins can delete certificate files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'));
