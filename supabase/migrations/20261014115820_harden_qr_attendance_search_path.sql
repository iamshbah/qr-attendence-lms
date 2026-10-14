CREATE OR REPLACE FUNCTION public.mark_attendance_with_qr(p_session_id uuid, p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_student public.students%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_record_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF NOT private.has_role(ARRAY['student'::public.app_role]) THEN RAISE EXCEPTION 'student_role_required'; END IF;

  SELECT * INTO v_student FROM public.students
  WHERE user_id = (SELECT auth.uid()) AND active = true LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'student_profile_not_linked'; END IF;

  SELECT * INTO v_session FROM public.attendance_sessions
  WHERE id = p_session_id AND active = true AND starts_at <= now() AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'attendance_session_expired_or_inactive'; END IF;

  IF p_token IS NULL OR length(p_token) < 32
     OR encode(extensions.digest(p_token, 'sha256'), 'hex') <> v_session.token_hash THEN
    RAISE EXCEPTION 'invalid_attendance_qr';
  END IF;
  IF v_student.class_id IS DISTINCT FROM v_session.class_id THEN RAISE EXCEPTION 'student_not_in_this_class'; END IF;
  IF EXISTS (SELECT 1 FROM public.attendance_records WHERE session_id = v_session.id AND student_id = v_student.id) THEN
    RAISE EXCEPTION 'attendance_already_marked';
  END IF;

  INSERT INTO public.attendance_records (session_id, student_id, status, marked_by, source, device_event_id)
  VALUES (v_session.id, v_student.id, 'present', NULL, 'qr', pg_catalog.gen_random_uuid()::text)
  RETURNING id INTO v_record_id;
  RETURN v_record_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.mark_attendance_with_qr(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_attendance_with_qr(uuid, text) TO authenticated;
