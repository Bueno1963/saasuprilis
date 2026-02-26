
-- Chart of Accounts for service provider (lab)
CREATE TABLE public.chart_of_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'despesa', -- receita, deducao, custo, despesa, resultado_financeiro
  parent_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  is_group boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chart_of_accounts" ON public.chart_of_accounts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read chart_of_accounts" ON public.chart_of_accounts
  FOR SELECT USING (true);

-- Updated at trigger
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
