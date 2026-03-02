
-- Portal access logs for LGPD compliance
CREATE TABLE public.portal_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_type text NOT NULL DEFAULT 'paciente', -- 'paciente' or 'medico'
  order_id uuid REFERENCES public.orders(id),
  patient_id uuid REFERENCES public.patients(id),
  doctor_name text,
  access_ip text,
  user_agent text,
  access_method text NOT NULL DEFAULT 'codigo', -- 'codigo', 'crm'
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  data_returned jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read portal_access_logs"
  ON public.portal_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert from edge functions (service role)
CREATE POLICY "Service can insert portal_access_logs"
  ON public.portal_access_logs FOR INSERT
  WITH CHECK (true);
