CREATE POLICY "Authenticated users can delete results"
ON public.results
FOR DELETE
TO authenticated
USING (true);