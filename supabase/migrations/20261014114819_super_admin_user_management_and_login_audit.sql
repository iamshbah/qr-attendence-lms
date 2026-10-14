CREATE OR REPLACE FUNCTION private.log_successful_auth_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at
     AND NEW.last_sign_in_at IS NOT NULL THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
    VALUES (
      NEW.id,
      'auth.login.success',
      'auth.user',
      NEW.id::text,
      jsonb_build_object('email', NEW.email, 'source', 'auth.users.last_sign_in_at'),
      NEW.last_sign_in_at
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS audit_successful_auth_login ON auth.users;
CREATE TRIGGER audit_successful_auth_login
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION private.log_successful_auth_login();

CREATE OR REPLACE FUNCTION public.super_admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_verified boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'super_admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, p.role, u.created_at, u.last_sign_in_at,
         (u.email_confirmed_at IS NOT NULL)
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC
  LIMIT 200;
END;
$function$;
REVOKE ALL ON FUNCTION public.super_admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.super_admin_list_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.super_admin_set_user_role(
  p_target_user_id uuid,
  p_new_role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_old_role public.app_role;
  v_target_email text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'super_admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_target_user_id IS NULL
     OR p_target_user_id = (SELECT auth.uid())
     OR p_new_role NOT IN ('student'::public.app_role, 'teacher'::public.app_role, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'invalid role change' USING ERRCODE = '22023';
  END IF;

  SELECT p.role, u.email INTO v_old_role, v_target_email
  FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE p.id = p_target_user_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_old_role = 'super_admin'::public.app_role THEN
    RAISE EXCEPTION 'super admin role cannot be changed through this operation' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles SET role = p_new_role, updated_at = now()
  WHERE id = p_target_user_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    (SELECT auth.uid()), 'user.role.changed', 'profile', p_target_user_id::text,
    jsonb_build_object('email', v_target_email, 'old_role', v_old_role::text, 'new_role', p_new_role::text)
  );
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.super_admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.super_admin_set_user_role(uuid, public.app_role) TO authenticated;
