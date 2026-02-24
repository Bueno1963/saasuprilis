
-- Audit log for permission changes
CREATE TABLE public.permission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid NOT NULL,
  action text NOT NULL, -- 'grant' or 'revoke'
  target_role text NOT NULL,
  route text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read permission_audit_log"
  ON public.permission_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert (trigger will handle this, but RLS needed)
CREATE POLICY "Admins can insert permission_audit_log"
  ON public.permission_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-log permission changes via trigger
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit_log (performed_by, action, target_role, route)
    VALUES (auth.uid(), CASE WHEN NEW.allowed THEN 'grant' ELSE 'revoke' END, NEW.role::text, NEW.route);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.allowed IS DISTINCT FROM NEW.allowed THEN
    INSERT INTO public.permission_audit_log (performed_by, action, target_role, route)
    VALUES (auth.uid(), CASE WHEN NEW.allowed THEN 'grant' ELSE 'revoke' END, NEW.role::text, NEW.route);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_permission_change
  AFTER INSERT OR UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_permission_change();
