
CREATE OR REPLACE FUNCTION public.generate_barcode()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(barcode FROM '\d+$') AS BIGINT)), 0) + 1
  INTO next_num
  FROM public.samples;
  
  NEW.barcode := 'LAB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$function$;
