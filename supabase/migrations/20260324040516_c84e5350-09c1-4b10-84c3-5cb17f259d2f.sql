
-- Remove Neutrófilos
DELETE FROM public.exam_parameters WHERE id = '817387f1-7747-4e24-8c81-7fcea10a77f8';

-- Add Mielócito and Pró Mielócito after Monócitos
INSERT INTO public.exam_parameters (exam_id, name, section, unit, sort_order, reference_range)
SELECT ec.id, 'Mielócito', 'Leucograma', '%', 16, NULL
FROM public.exam_catalog ec WHERE ec.code = 'HEMO';

INSERT INTO public.exam_parameters (exam_id, name, section, unit, sort_order, reference_range)
SELECT ec.id, 'Pró Mielócito', 'Leucograma', '%', 17, NULL
FROM public.exam_catalog ec WHERE ec.code = 'HEMO';
