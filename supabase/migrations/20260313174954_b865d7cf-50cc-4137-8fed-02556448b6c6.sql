
-- Shift LEUCOGRAMA sort_orders to make room: move 10+ up by 1 to insert obs after RDW at sort_order 8
UPDATE exam_parameters SET sort_order = sort_order + 1 WHERE exam_id = 'bd91b4ab-7c43-4552-8c18-fe14450b14b2' AND sort_order >= 8 AND sort_order <= 9;

-- Shift LEUCOGRAMA and PLAQUETAS to make room for obs after Monócitos: move 20+ up by 1
UPDATE exam_parameters SET sort_order = sort_order + 1 WHERE exam_id = 'bd91b4ab-7c43-4552-8c18-fe14450b14b2' AND sort_order >= 20;

-- Now Leucócitos is at 11, ..., Monócitos is at 20, Plaquetas starts at 21
-- We need obs after Monócitos (20), so insert at 21 and shift plaquetas again
-- Actually let me recalculate: after first update, Leucócitos=11, sort orders 10->11 done. Let me redo.

-- Let me just do a clean reassignment and insert
-- First: shift everything >= 8 by 1 (to insert Obs Eritrograma at 8)
UPDATE exam_parameters SET sort_order = sort_order + 1 WHERE exam_id = 'bd91b4ab-7c43-4552-8c18-fe14450b14b2' AND sort_order >= 8;

-- Now Leucócitos=11, ..., Monócitos=20, Plaquetas=21...
-- Shift everything >= 21 by 1 (to insert Obs Leucograma at 21)
UPDATE exam_parameters SET sort_order = sort_order + 1 WHERE exam_id = 'bd91b4ab-7c43-4552-8c18-fe14450b14b2' AND sort_order >= 21;

-- Insert Observações after RDW (ERITROGRAMA, sort_order 8)
INSERT INTO exam_parameters (exam_id, name, section, unit, reference_range, sort_order)
VALUES ('bd91b4ab-7c43-4552-8c18-fe14450b14b2', 'Observações', 'ERITROGRAMA', null, null, 8);

-- Insert Observações after Monócitos (LEUCOGRAMA, sort_order 21)
INSERT INTO exam_parameters (exam_id, name, section, unit, reference_range, sort_order)
VALUES ('bd91b4ab-7c43-4552-8c18-fe14450b14b2', 'Observações', 'LEUCOGRAMA', null, null, 21);
