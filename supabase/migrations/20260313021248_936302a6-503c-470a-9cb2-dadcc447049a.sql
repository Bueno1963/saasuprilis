
-- Tabela de POPs conforme RDC 978/2025 ANVISA
CREATE TABLE public.pops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'pre_analitica',
  sector text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'rascunho',
  objective text DEFAULT '',
  scope text DEFAULT '',
  responsibilities text DEFAULT '',
  materials text DEFAULT '',
  procedure_steps text DEFAULT '',
  safety_notes text DEFAULT '',
  references_docs text DEFAULT '',
  revision_history text DEFAULT '',
  effective_date date,
  next_review_date date,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pops"
  ON public.pops FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and tecnicos can insert pops"
  ON public.pops FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico')
  );

CREATE POLICY "Admins and tecnicos can update pops"
  ON public.pops FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico')
  );

CREATE POLICY "Admins can delete pops"
  ON public.pops FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_pops_updated_at
  BEFORE UPDATE ON public.pops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
