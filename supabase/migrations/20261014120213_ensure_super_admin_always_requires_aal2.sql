-- Never allow a Super Admin role to pass role checks without a verified AAL2 session,
-- even if a future policy accidentally includes super_admin in its allowed-role array.
CREATE OR REPLACE FUNCTION private.has_role(allowed public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND (
        (p.role = 'super_admin'::public.app_role AND (SELECT auth.jwt() ->> 'aal') = 'aal2')
        OR (
          p.role <> 'super_admin'::public.app_role
          AND p.role = ANY(allowed)
        )
      )
  );
$function$;
