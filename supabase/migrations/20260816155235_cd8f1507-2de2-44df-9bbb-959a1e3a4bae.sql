-- ============ documents ============
DROP POLICY IF EXISTS "documents_public_read" ON public.documents;
REVOKE ALL ON public.documents FROM anon;
REVOKE ALL ON public.documents FROM authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
CREATE POLICY "documents_read_indexed" ON public.documents
  FOR SELECT TO authenticated
  USING (status = 'indexed' OR public.has_role(auth.uid(), 'admin'));

-- ============ document_chunks ============
REVOKE ALL ON public.document_chunks FROM anon;
REVOKE ALL ON public.document_chunks FROM authenticated;
GRANT SELECT ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;
CREATE POLICY "document_chunks_admin_read" ON public.document_chunks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.match_document_chunks(vector, integer, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_document_chunks(vector, integer, double precision) FROM anon;
REVOKE ALL ON FUNCTION public.match_document_chunks(vector, integer, double precision) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, double precision) TO service_role;

-- ============ leads ============
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
CREATE POLICY "leads_admin_select" ON public.leads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads_admin_update" ON public.leads
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads_admin_delete" ON public.leads
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ validations ============
ALTER TABLE public.validations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS validations_user_id_idx ON public.validations(user_id);

REVOKE ALL ON public.validations FROM anon;
REVOKE ALL ON public.validations FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.validations TO authenticated;
GRANT ALL ON public.validations TO service_role;

CREATE POLICY "validations_select_own_or_admin" ON public.validations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "validations_insert_own" ON public.validations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "validations_update_own_or_admin" ON public.validations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "validations_delete_own_or_admin" ON public.validations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ storage: attachments ============
DROP POLICY IF EXISTS "Uploads de anexos permitidos" ON storage.objects;

CREATE POLICY "attachments_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "attachments_select_own_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND (split_part(name, '/', 1) = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "attachments_update_own_or_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments' AND (split_part(name, '/', 1) = auth.uid()::text OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK (bucket_id = 'attachments' AND (split_part(name, '/', 1) = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "attachments_delete_own_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (split_part(name, '/', 1) = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));