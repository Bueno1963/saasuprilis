
CREATE TABLE public.maintenance_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  equipment_name text DEFAULT '',
  maintenance_type text NOT NULL DEFAULT 'preventiva',
  scheduled_date date,
  recurrence text DEFAULT 'unico',
  responsible text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'agendado',
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance_schedule"
  ON public.maintenance_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and tecnicos can insert maintenance_schedule"
  ON public.maintenance_schedule FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admins and tecnicos can update maintenance_schedule"
  ON public.maintenance_schedule FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico'));

CREATE POLICY "Admins can delete maintenance_schedule"
  ON public.maintenance_schedule FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_maintenance_schedule_updated_at
  BEFORE UPDATE ON public.maintenance_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
