
-- Table for exam sub-parameters (e.g. Hemácias, Hemoglobina inside Hemograma)
CREATE TABLE public.exam_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exam_catalog(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  unit TEXT DEFAULT '',
  reference_range TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read exam_parameters"
ON public.exam_parameters FOR SELECT USING (true);

CREATE POLICY "Admins can insert exam_parameters"
ON public.exam_parameters FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exam_parameters"
ON public.exam_parameters FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exam_parameters"
ON public.exam_parameters FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_exam_parameters_exam_id ON public.exam_parameters(exam_id);
