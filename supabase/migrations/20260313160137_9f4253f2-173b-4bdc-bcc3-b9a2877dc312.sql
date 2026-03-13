
CREATE TABLE public.parameter_reference_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id uuid NOT NULL REFERENCES public.exam_parameters(id) ON DELETE CASCADE,
  age_group text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'Ambos',
  reference_value text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parameter_reference_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read parameter_reference_ranges"
  ON public.parameter_reference_ranges FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert parameter_reference_ranges"
  ON public.parameter_reference_ranges FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update parameter_reference_ranges"
  ON public.parameter_reference_ranges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete parameter_reference_ranges"
  ON public.parameter_reference_ranges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
