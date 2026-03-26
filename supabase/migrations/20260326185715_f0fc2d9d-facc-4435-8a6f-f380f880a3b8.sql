-- Fix the stuck TEMP barcode for ORD-2026-003 sample
UPDATE samples SET barcode = 'LAB20260325002' WHERE barcode = 'TEMP' AND id = 'c5a2c262-c3e5-432e-9b4e-0e3c2f15bf27';

-- Insert the missing sample for ORD-2026-004
INSERT INTO samples (order_id, sample_type, sector, status, tenant_id, barcode)
VALUES ('87189795-79ed-421a-94c6-4a59732b6f41', 'Soro', 'Bioquímica', 'collected', '00000000-0000-0000-0000-000000000001', 'LAB20260326001');