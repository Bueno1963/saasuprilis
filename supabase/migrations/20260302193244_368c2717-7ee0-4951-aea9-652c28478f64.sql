CREATE POLICY "Authenticated users can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (true);