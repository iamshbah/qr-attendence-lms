DROP POLICY IF EXISTS "staff read students" ON public.students;
CREATE POLICY "staff read students" ON public.students FOR SELECT TO authenticated USING (
  (SELECT private.has_role(ARRAY['admin'::public.app_role]))
  OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = students.class_id AND c.teacher_id = (SELECT auth.uid())
  ))
);

DROP POLICY IF EXISTS "staff read classes" ON public.classes;
CREATE POLICY "staff read classes" ON public.classes FOR SELECT TO authenticated USING (
  (SELECT private.has_role(ARRAY['admin'::public.app_role]))
  OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND classes.teacher_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "staff read attendance" ON public.attendance_records;
CREATE POLICY "staff read attendance" ON public.attendance_records FOR SELECT TO authenticated USING (
  (SELECT private.has_role(ARRAY['admin'::public.app_role]))
  OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
    SELECT 1 FROM public.attendance_sessions s JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id AND c.teacher_id = (SELECT auth.uid())
  ))
  OR EXISTS (SELECT 1 FROM public.students st WHERE st.id = attendance_records.student_id AND st.user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "staff mark attendance" ON public.attendance_records;
CREATE POLICY "staff mark attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) = marked_by
  AND (
    (SELECT private.has_role(ARRAY['admin'::public.app_role]))
    OR ((SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
      SELECT 1 FROM public.attendance_sessions s JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = attendance_records.session_id AND c.teacher_id = (SELECT auth.uid())
    ))
  )
);

DROP POLICY IF EXISTS "staff create sessions" ON public.attendance_sessions;
CREATE POLICY "staff create sessions" ON public.attendance_sessions FOR INSERT TO authenticated WITH CHECK (
  created_by = (SELECT auth.uid())
  AND ((SELECT private.has_role(ARRAY['admin'::public.app_role])) OR (
    (SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid())
    )
  ))
);

DROP POLICY IF EXISTS "staff read sessions" ON public.attendance_sessions;
CREATE POLICY "staff read sessions" ON public.attendance_sessions FOR SELECT TO authenticated USING (
  (SELECT private.has_role(ARRAY['admin'::public.app_role])) OR (
    (SELECT private.has_role(ARRAY['teacher'::public.app_role])) AND EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid())
    )
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
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance_sessions.class_id AND c.teacher_id = (SELECT auth.uid()))
  )
);
