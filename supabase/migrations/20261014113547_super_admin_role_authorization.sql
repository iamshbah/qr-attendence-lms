CREATE OR REPLACE FUNCTION private.has_role(allowed public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND (
        p.role = 'super_admin'::public.app_role
        OR p.role = ANY(allowed)
      )
  );
$function$;
