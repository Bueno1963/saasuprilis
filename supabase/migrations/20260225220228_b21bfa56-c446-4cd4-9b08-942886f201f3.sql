
CREATE TABLE public.integration_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'success',
  direction TEXT NOT NULL DEFAULT 'inbound',
  source_system TEXT NOT NULL DEFAULT '',
  destination_system TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  error_message TEXT,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read integration_sync_logs"
  ON public.integration_sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert integration_sync_logs"
  ON public.integration_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete integration_sync_logs"
  ON public.integration_sync_logs
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
