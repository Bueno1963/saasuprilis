
-- =============================================================
-- RDC 978/2025 Compliance: Sample Traceability & Audit System
-- =============================================================

-- 1. Sample Tracking Events (Chain of Custody / Rastreabilidade)
CREATE TABLE public.sample_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'status_change',
  previous_status text,
  new_status text,
  performed_by uuid REFERENCES auth.users(id),
  performed_by_name text NOT NULL DEFAULT '',
  location text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Sample Non-Conformities (Não-conformidades)
CREATE TYPE public.nonconformity_severity AS ENUM ('baixa', 'media', 'alta', 'critica');

CREATE TABLE public.sample_nonconformities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity nonconformity_severity NOT NULL DEFAULT 'media',
  description text DEFAULT '',
  corrective_action text DEFAULT '',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  reported_by uuid REFERENCES auth.users(id),
  reported_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Sample Temperature Logs (Controle de Temperatura e Transporte)
CREATE TABLE public.sample_temperature_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  temperature_celsius numeric NOT NULL,
  min_acceptable numeric NOT NULL DEFAULT 2,
  max_acceptable numeric NOT NULL DEFAULT 8,
  is_within_range boolean NOT NULL DEFAULT true,
  location text DEFAULT '',
  transport_condition text DEFAULT 'refrigerado',
  recorded_by uuid REFERENCES auth.users(id),
  recorded_by_name text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add new columns to samples table for RDC 978 compliance
ALTER TABLE public.samples 
  ADD COLUMN IF NOT EXISTS storage_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS disposal_at timestamptz,
  ADD COLUMN IF NOT EXISTS disposal_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_rejected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stability_hours integer DEFAULT 72,
  ADD COLUMN IF NOT EXISTS transport_condition text DEFAULT 'refrigerado';

-- Enable RLS on all new tables
ALTER TABLE public.sample_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_temperature_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can read, insert; admins can manage all
CREATE POLICY "Authenticated users can read sample_tracking_events"
  ON public.sample_tracking_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sample_tracking_events"
  ON public.sample_tracking_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read sample_nonconformities"
  ON public.sample_nonconformities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sample_nonconformities"
  ON public.sample_nonconformities FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sample_nonconformities"
  ON public.sample_nonconformities FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read sample_temperature_logs"
  ON public.sample_temperature_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sample_temperature_logs"
  ON public.sample_temperature_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_sample_tracking_sample_id ON public.sample_tracking_events(sample_id);
CREATE INDEX idx_sample_tracking_created_at ON public.sample_tracking_events(created_at);
CREATE INDEX idx_sample_nonconformities_sample_id ON public.sample_nonconformities(sample_id);
CREATE INDEX idx_sample_temperature_sample_id ON public.sample_temperature_logs(sample_id);

-- Updated_at trigger for nonconformities
CREATE TRIGGER update_sample_nonconformities_updated_at
  BEFORE UPDATE ON public.sample_nonconformities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
