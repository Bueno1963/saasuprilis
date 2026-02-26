
-- Financial module tables

-- 1. Insurance billing batches (faturamento de convênios)
CREATE TABLE public.billing_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_plan_id uuid REFERENCES public.insurance_plans(id) NOT NULL,
  batch_number text NOT NULL,
  reference_month text NOT NULL, -- 'YYYY-MM'
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto', -- aberto, enviado, pago, parcial, glosado
  sent_at timestamptz,
  paid_at timestamptz,
  paid_amount numeric DEFAULT 0,
  glosa_amount numeric DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Receivables (contas a receber)
CREATE TABLE public.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  patient_id uuid REFERENCES public.patients(id) NOT NULL,
  billing_batch_id uuid REFERENCES public.billing_batches(id),
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'particular', -- particular, convenio
  status text NOT NULL DEFAULT 'pendente', -- pendente, pago, parcial, cancelado, inadimplente
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_at timestamptz,
  paid_amount numeric DEFAULT 0,
  payment_method text, -- dinheiro, cartao, pix, boleto, transferencia
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Payables (contas a pagar)
CREATE TABLE public.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outros', -- fornecedores, salarios, insumos, manutencao, aluguel, outros
  supplier text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_at timestamptz,
  paid_amount numeric DEFAULT 0,
  payment_method text,
  recurrence text DEFAULT 'unico', -- unico, mensal, trimestral, anual
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- RLS policies: admin only for all financial tables
CREATE POLICY "Admins can read billing_batches" ON public.billing_batches FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert billing_batches" ON public.billing_batches FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update billing_batches" ON public.billing_batches FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete billing_batches" ON public.billing_batches FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read receivables" ON public.receivables FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert receivables" ON public.receivables FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update receivables" ON public.receivables FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete receivables" ON public.receivables FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read payables" ON public.payables FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert payables" ON public.payables FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payables" ON public.payables FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payables" ON public.payables FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_billing_batches_updated_at BEFORE UPDATE ON public.billing_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payables_updated_at BEFORE UPDATE ON public.payables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
