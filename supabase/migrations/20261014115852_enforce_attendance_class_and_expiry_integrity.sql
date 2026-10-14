DROP POLICY IF EXISTS "staff mark attendance" ON public.attendance_records;
CREATE POLICY "staff mark attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (
  marked_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.attendance_sessions s
    JOIN public.students st ON st.id = attendance_records.student_id
    WHERE s.id = attendance_records.session_id AND s.active = true AND s.expires_at > now()
      AND st.active = true AND st.class_id = s.class_id
      AND (
        (SELECT private.has_role(ARRAY['admin'::public.app_role]))
        OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
          SELECT 1 FROM public.classes c WHERE c.id = s.class_id AND c.teacher_id = (SELECT auth.uid())
        ))
      )
  )
);

DROP POLICY IF EXISTS "staff create sessions" ON public.attendance_sessions;
CREATE POLICY "staff create sessions" ON public.attendance_sessions FOR INSERT TO authenticated WITH CHECK (
  created_by = (SELECT auth.uid()) AND active = true AND starts_at <= now()
  AND expires_at > now() AND expires_at <= now() + interval '24 hours'
  AND (
    (SELECT private.has_role(ARRAY['admin'::public.app_role]))
    OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid())
    ))
  )
);

DROP POLICY IF EXISTS "admin or creator update sessions" ON public.attendance_sessions;
CREATE POLICY "admin or creator update sessions" ON public.attendance_sessions FOR UPDATE TO authenticated
USING (
  (SELECT private.has_role(ARRAY['admin'::public.app_role])) OR (
    (SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND attendance_sessions.created_by = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  (SELECT private.has_role(ARRAY['admin'::public.app_role])) OR (
    (SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND attendance_sessions.created_by = (SELECT auth.uid())
    AND attendance_sessions.expires_at <= now() + interval '24 hours'
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid()))
  )
);
