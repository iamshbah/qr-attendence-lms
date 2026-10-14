-- Restrict the exposed QR attendance RPC to authenticated callers.
-- The function itself must continue validating auth.uid(), token hash, class, expiry, and duplicates.
REVOKE EXECUTE ON FUNCTION public.mark_attendance_with_qr(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_attendance_with_qr(uuid, text) TO authenticated;
