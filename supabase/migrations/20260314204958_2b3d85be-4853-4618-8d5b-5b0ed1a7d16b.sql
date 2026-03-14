
ALTER TABLE public.qc_analyte_configs ADD COLUMN sector text NOT NULL DEFAULT '';
ALTER TABLE public.qc_control_lots ADD COLUMN sector text NOT NULL DEFAULT '';
