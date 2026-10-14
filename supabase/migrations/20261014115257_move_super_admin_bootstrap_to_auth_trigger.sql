-- Promote only the verified, exact designated email from a trusted auth.users trigger.
-- This avoids exposing a SECURITY DEFINER bootstrap RPC through the public Data API.
CREATE OR REPLACE FUNCTION private.bootstrap_initial_super_admin_on_auth_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'imrankhanshahaniofficial@gmail.com'
     AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
      'super_admin'::public.app_role
    )
    ON CONFLICT (id) DO UPDATE
      SET role = 'super_admin'::public.app_role,
          updated_at = now();
  ELSIF TG_OP = 'UPDATE'
     AND lower(coalesce(OLD.email, '')) = 'imrankhanshahaniofficial@gmail.com'
     AND lower(coalesce(NEW.email, '')) <> 'imrankhanshahaniofficial@gmail.com' THEN
    UPDATE public.profiles
    SET role = 'student'::public.app_role,
        updated_at = now()
    WHERE id = NEW.id
      AND role = 'super_admin'::public.app_role;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.bootstrap_initial_super_admin_on_auth_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS zz_bootstrap_initial_super_admin ON auth.users;
CREATE TRIGGER zz_bootstrap_initial_super_admin
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.bootstrap_initial_super_admin_on_auth_change();

DROP FUNCTION IF EXISTS public.bootstrap_initial_super_admin();
