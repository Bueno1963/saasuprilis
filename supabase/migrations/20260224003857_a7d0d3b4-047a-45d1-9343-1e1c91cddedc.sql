
-- Table to store dynamic role permissions for menu routes
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  route text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, route)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read permissions (needed for sidebar filtering)
CREATE POLICY "Authenticated users can read role_permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

-- Only admins can manage permissions
CREATE POLICY "Admins can insert role_permissions"
  ON public.role_permissions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update role_permissions"
  ON public.role_permissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete role_permissions"
  ON public.role_permissions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default permissions based on current hardcoded rules
-- Admin: all routes
INSERT INTO public.role_permissions (role, route, allowed) VALUES
  ('admin', '/', true),
  ('admin', '/pacientes', true),
  ('admin', '/pedidos', true),
  ('admin', '/amostras', true),
  ('admin', '/worklist', true),
  ('admin', '/qc', true),
  ('admin', '/resultados', true),
  ('admin', '/laudos', true),
  ('admin', '/configuracoes', true);

-- Tecnico: all except configuracoes
INSERT INTO public.role_permissions (role, route, allowed) VALUES
  ('tecnico', '/', true),
  ('tecnico', '/pacientes', true),
  ('tecnico', '/pedidos', true),
  ('tecnico', '/amostras', true),
  ('tecnico', '/worklist', true),
  ('tecnico', '/qc', true),
  ('tecnico', '/resultados', true),
  ('tecnico', '/laudos', true),
  ('tecnico', '/configuracoes', false);

-- Recepcao: only pre-analytical
INSERT INTO public.role_permissions (role, route, allowed) VALUES
  ('recepcao', '/', false),
  ('recepcao', '/pacientes', true),
  ('recepcao', '/pedidos', true),
  ('recepcao', '/amostras', true),
  ('recepcao', '/worklist', false),
  ('recepcao', '/qc', false),
  ('recepcao', '/resultados', false),
  ('recepcao', '/laudos', false),
  ('recepcao', '/configuracoes', false);
