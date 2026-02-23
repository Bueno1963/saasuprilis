CREATE POLICY "Authenticated users can delete orders"
ON public.orders
FOR DELETE
USING (true);