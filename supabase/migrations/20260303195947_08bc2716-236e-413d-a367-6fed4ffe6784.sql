
ALTER TABLE public.lab_settings
ADD COLUMN daily_appointment_limit integer DEFAULT 0;

COMMENT ON COLUMN public.lab_settings.daily_appointment_limit IS 'Maximum appointments per day. 0 means unlimited.';
