-- 2) Helper function to check super_admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = _user_id AND role = 'super_admin')
$$;

-- 3) Promote existing admins to super_admin (you can demote later as needed)
UPDATE public.tenant_members SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';