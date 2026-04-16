-- 1) Add super_admin to app_role enum (must run alone before usage)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';