CREATE TRIGGER trigger_generate_barcode
  BEFORE INSERT ON public.samples
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_barcode();