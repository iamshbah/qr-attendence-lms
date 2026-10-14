CREATE OR REPLACE FUNCTION public.bootstrap_initial_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_email text;
  v_confirmed_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(u.email), u.email_confirmed_at
    INTO v_email, v_confirmed_at
  FROM auth.users AS u
  WHERE u.id = v_user_id;

  IF v_email IS DISTINCT FROM 'imrankhanshahaniofficial@gmail.com'
     OR v_confirmed_at IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET role = 'super_admin'::public.app_role,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.bootstrap_initial_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_super_admin() TO authenticated;
