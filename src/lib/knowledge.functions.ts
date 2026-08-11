import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type KnowledgeDocument = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  docType: string;
  fileName: string;
  pageCount: number | null;
  chunkCount: number;
  ociObjectName: string | null;
  ociStored: boolean;
};

export type OciStatus = {
  configured: boolean;
  connected: boolean;
  region: string | null;
  namespace: string | null;
  bucket: string | null;
  missingEnv: string[];
  error: string | null;
  objects: Array<{ name: string; size: number | null }>;
};

/** Documentos indexados + estado real da integração Oracle Cloud (sem credenciais). */
export const getKnowledgeBase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, title, author, category, doc_type, file_name, page_count, chunk_count, oci_object_name")
      .eq("status", "indexed")
      .order("title");
    if (error) throw new Error(error.message);

    const { getOciConfig, missingOciEnv, listObjects } = await import(
      "@/lib/oci/object-storage.server"
    );
    const cfg = getOciConfig();
    const oci: OciStatus = {
      configured: cfg !== null,
      connected: false,
      region: cfg?.region ?? null,
      namespace: cfg?.namespace ?? null,
      bucket: cfg?.bucket ?? null,
      missingEnv: missingOciEnv(),
      error: null,
      objects: [],
    };

    if (cfg) {
      try {
        const objects = await listObjects(cfg);
        oci.connected = true;
        oci.objects = objects.map((o) => ({ name: o.name, size: o.size }));
      } catch (e) {
        oci.error = e instanceof Error ? e.message : "Falha ao consultar o Object Storage";
      }
    }

    const names = new Set(oci.objects.map((o) => o.name));
    const documents: KnowledgeDocument[] = (data ?? []).map((d) => ({
      id: d.id as string,
      title: d.title as string,
      author: (d.author as string | null) ?? null,
      category: (d.category as string | null) ?? null,
      docType: (d.doc_type as string) ?? "pdf",
      fileName: d.file_name as string,
      pageCount: (d.page_count as number | null) ?? null,
      chunkCount: (d.chunk_count as number) ?? 0,
      ociObjectName: (d.oci_object_name as string | null) ?? null,
      ociStored: Boolean(d.oci_object_name && names.has(d.oci_object_name as string)),
    }));

    return { documents, oci };
  });
