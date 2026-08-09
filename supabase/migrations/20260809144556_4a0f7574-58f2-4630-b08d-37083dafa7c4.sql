CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  doc_type text NOT NULL DEFAULT 'pdf',
  file_name text NOT NULL,
  page_count integer,
  status text NOT NULL DEFAULT 'pending',
  ocr_used boolean NOT NULL DEFAULT false,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_public_read" ON public.documents FOR SELECT USING (true);

CREATE TABLE public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  page_number integer,
  page_end integer,
  content text NOT NULL,
  token_estimate integer,
  embedding vector(3072),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.document_chunks TO service_role;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX document_chunks_document_id_idx ON public.document_chunks (document_id);
CREATE INDEX document_chunks_embedding_idx
  ON public.document_chunks USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(3072),
  match_count integer DEFAULT 8,
  similarity_threshold double precision DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_title text,
  page_number integer,
  page_end integer,
  chunk_index integer,
  content text,
  similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.document_id, d.title, c.page_number, c.page_end, c.chunk_index, c.content,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) AS similarity
  FROM public.document_chunks c
  JOIN public.documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) >= similarity_threshold
  ORDER BY c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_document_chunks(vector, integer, double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector, integer, double precision) TO service_role;