-- Add unique constraint to admin_id for proper upsert functionality
ALTER TABLE public.admin_status ADD CONSTRAINT admin_status_admin_id_unique UNIQUE (admin_id);