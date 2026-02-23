
-- 1. Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico', 'recepcao');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role_display TEXT NOT NULL DEFAULT 'Técnico',
  sector TEXT DEFAULT NULL,
  crm TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'tecnico',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tecnico');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  insurance TEXT DEFAULT 'Particular',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patients" ON public.patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" ON public.patients
  FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_name TEXT NOT NULL DEFAULT '',
  insurance TEXT DEFAULT 'Particular',
  exams TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'collected', 'processing', 'completed', 'released')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Samples table
CREATE TABLE public.samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  sample_type TEXT NOT NULL CHECK (sample_type IN ('Sangue', 'Urina', 'Soro', 'Plasma')),
  sector TEXT NOT NULL CHECK (sector IN ('Hematologia', 'Bioquímica', 'Imunologia', 'Microbiologia')),
  status TEXT NOT NULL DEFAULT 'collected' CHECK (status IN ('collected', 'triaged', 'processing', 'analyzed', 'released')),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read samples" ON public.samples
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert samples" ON public.samples
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update samples" ON public.samples
  FOR UPDATE TO authenticated USING (true);

-- 12. Results table
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  sample_id UUID REFERENCES public.samples(id),
  exam TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  reference_range TEXT NOT NULL DEFAULT '',
  flag TEXT NOT NULL DEFAULT 'normal' CHECK (flag IN ('normal', 'high', 'low', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'released')),
  analyst_id UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read results" ON public.results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert results" ON public.results
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update results" ON public.results
  FOR UPDATE TO authenticated USING (true);

-- 13. QC Data table
CREATE TABLE public.qc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyte TEXT NOT NULL,
  level TEXT NOT NULL,
  value NUMERIC NOT NULL,
  mean NUMERIC NOT NULL,
  sd NUMERIC NOT NULL,
  equipment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'fail')),
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qc_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read qc_data" ON public.qc_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert qc_data" ON public.qc_data
  FOR INSERT TO authenticated WITH CHECK (true);

-- 14. Order number sequence function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders;
  
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- 15. Barcode generation function
CREATE OR REPLACE FUNCTION public.generate_barcode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(barcode FROM '\d+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.samples;
  
  NEW.barcode := 'LAB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_barcode
  BEFORE INSERT ON public.samples
  FOR EACH ROW
  WHEN (NEW.barcode IS NULL OR NEW.barcode = '')
  EXECUTE FUNCTION public.generate_barcode();
