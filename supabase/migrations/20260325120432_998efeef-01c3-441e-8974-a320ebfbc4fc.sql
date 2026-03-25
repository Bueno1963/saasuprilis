
-- Fix generate_barcode to never produce TEMP or duplicate barcodes
CREATE OR REPLACE FUNCTION public.generate_barcode()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num BIGINT;
  new_barcode TEXT;
  date_prefix TEXT;
BEGIN
  date_prefix := 'LAB' || TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(barcode FROM '\d{3}$') AS BIGINT)), 0) + 1
  INTO next_num
  FROM public.samples
  WHERE barcode LIKE date_prefix || '%';
  
  new_barcode := date_prefix || LPAD(next_num::TEXT, 3, '0');
  
  -- Ensure uniqueness by incrementing if barcode already exists
  WHILE EXISTS (SELECT 1 FROM public.samples WHERE barcode = new_barcode) LOOP
    next_num := next_num + 1;
    new_barcode := date_prefix || LPAD(next_num::TEXT, 3, '0');
  END LOOP;
  
  NEW.barcode := new_barcode;
  RETURN NEW;
END;
$function$;

-- Fix existing TEMP barcode
UPDATE public.samples SET barcode = 'LAB' || TO_CHAR(collected_at, 'YYYYMMDD') || '001' WHERE barcode = 'TEMP';
