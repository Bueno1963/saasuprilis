
-- Insert 9 missing MAXCELL analytes
INSERT INTO public.exam_catalog (code, name, sector, material, equipment, status, section_group, method)
VALUES
  ('LYM_ABS', 'Linfócitos (#)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('LYM_PCT', 'Linfócitos (%)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('MON_ABS', 'Monócitos (#)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('MON_PCT', 'Monócitos (%)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('EOS_ABS', 'Eosinófilos (#)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('EOS_PCT', 'Eosinófilos (%)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('BAS_ABS', 'Basófilos (#)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('BAS_PCT', 'Basófilos (%)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo'),
  ('IG_PCT', 'Granulócitos Imaturos (%)', 'Hematologia', 'Sangue', 'MAXCELL500 D', 'active', '', 'Citometria de Fluxo');

-- Update existing 18 exams to match the integration equipment name
UPDATE public.exam_catalog
SET equipment = 'MAXCELL500 D'
WHERE UPPER(code) IN ('WBC','RBC','HGB','HCT','MCV','MCH','MCHC','RDW_CV','RDW_SD','PLT','MPV','PDW','PCT','P-LCR','NEU_ABS','NEU_PCT','NRBC','IG_ABS')
AND equipment = 'MaxCell 500F';
