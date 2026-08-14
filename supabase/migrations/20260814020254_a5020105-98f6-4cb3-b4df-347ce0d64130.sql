DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='validations' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.validations', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%attachment%' LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;
REVOKE SELECT ON public.validations FROM anon;
CREATE POLICY "Uploads de anexos permitidos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'attachments');