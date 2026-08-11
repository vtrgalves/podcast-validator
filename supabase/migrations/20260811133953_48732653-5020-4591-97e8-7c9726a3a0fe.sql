ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS oci_object_name text;

UPDATE public.documents
SET category = 'Pesquisa acadêmica',
    oci_object_name = 'research/TCC_Versao_final_Vitor_Hugo_Galves_Correa.pdf'
WHERE file_name = 'TCC_Versao_final_Vitor_Hugo_Galves_Correa.pdf';

UPDATE public.documents
SET category = 'Ebook',
    oci_object_name = 'ebook/ebook_como_levar_a_sua_mensagem_alem_vitor_galves.pdf'
WHERE file_name = 'ebook_como_levar_a_sua_mensagem_alem_vitor_galves.pdf';