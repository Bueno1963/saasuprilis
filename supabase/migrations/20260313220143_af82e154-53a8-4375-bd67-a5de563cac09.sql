CREATE TABLE public.insurance_plan_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_plan_id uuid NOT NULL REFERENCES public.insurance_plans(id) ON DELETE CASCADE,
  procedure_code text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(insurance_plan_id, procedure_code)
);

ALTER TABLE public.insurance_plan_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read insurance_plan_exams"
  ON public.insurance_plan_exams FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert insurance_plan_exams"
  ON public.insurance_plan_exams FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update insurance_plan_exams"
  ON public.insurance_plan_exams FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete insurance_plan_exams"
  ON public.insurance_plan_exams FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));