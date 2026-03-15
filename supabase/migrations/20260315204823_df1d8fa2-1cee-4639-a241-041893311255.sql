CREATE TABLE public.report_sector_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  show_history BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sector, tenant_id)
);

ALTER TABLE public.report_sector_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read report_sector_settings"
  ON public.report_sector_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report_sector_settings"
  ON public.report_sector_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update report_sector_settings"
  ON public.report_sector_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);