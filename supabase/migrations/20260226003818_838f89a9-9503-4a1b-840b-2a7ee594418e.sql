
CREATE TABLE public.accounting_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  debit_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  credit_account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  amount numeric NOT NULL DEFAULT 0,
  document_number text,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'ativo',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accounting_entries" ON public.accounting_entries
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read accounting_entries" ON public.accounting_entries
  FOR SELECT USING (true);

CREATE TRIGGER update_accounting_entries_updated_at
  BEFORE UPDATE ON public.accounting_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
