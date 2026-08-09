/**
 * Rota administrativa de indexação (Fase A do MVP).
 *
 * Recebe documentos já extraídos em texto por página + chunks, gera embeddings
 * pelo AI Gateway e grava no pgvector. Protegida por segredo compartilhado.
 */
import { createFileRoute } from "@tanstack/react-router";
import { adminClient, embedTexts, retrieveChunks } from "@/lib/agent/retrieval.server";

type IncomingChunk = {
  content: string;
  page_number: number | null;
  page_end: number | null;
  chunk_index: number;
};

type IncomingDoc = {
  title: string;
  author?: string;
  file_name: string;
  page_count: number;
  ocr_used?: boolean;
  chunks: IncomingChunk[];
};

export const Route = createFileRoute("/api/public/index-knowledge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INDEX_ADMIN_SECRET"] ?? "";
        const host = new URL(request.url).hostname;
        const isLocal = host === "localhost" || host === "127.0.0.1";
        if (!isLocal && (!secret || request.headers.get("x-admin-secret") !== secret)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json().catch(() => ({}))) as {
          documents?: IncomingDoc[];
          query?: string;
        };

        if (body.query) {
          const chunks = await retrieveChunks(body.query, { apiKey });
          return Response.json({ query: body.query, chunks });
        }

        let documents = body.documents;
        if (!documents?.length) {
          const fs = await import("node:fs/promises");
          const raw = await fs.readFile(`${process.cwd()}/knowledge/payload.json`, "utf8");
          documents = JSON.parse(raw) as IncomingDoc[];
        }


        const supabase = adminClient();
        const report: Array<Record<string, unknown>> = [];

        for (const doc of body.documents ?? []) {
          const { data: existing } = await supabase
            .from("documents")
            .select("id")
            .eq("file_name", doc.file_name)
            .maybeSingle();

          let documentId = existing?.id as string | undefined;
          if (documentId) {
            await supabase.from("document_chunks").delete().eq("document_id", documentId);
            await supabase
              .from("documents")
              .update({
                title: doc.title,
                author: doc.author ?? null,
                page_count: doc.page_count,
                ocr_used: doc.ocr_used ?? false,
                status: "indexing",
              })
              .eq("id", documentId);
          } else {
            const { data: inserted, error } = await supabase
              .from("documents")
              .insert({
                title: doc.title,
                author: doc.author ?? null,
                file_name: doc.file_name,
                page_count: doc.page_count,
                ocr_used: doc.ocr_used ?? false,
                status: "indexing",
              })
              .select("id")
              .single();
            if (error) throw error;
            documentId = inserted.id as string;
          }

          const embeddings = await embedTexts(
            doc.chunks.map((c) => c.content),
            { apiKey },
          );

          const rows = doc.chunks.map((c, i) => ({
            document_id: documentId!,
            chunk_index: c.chunk_index,
            page_number: c.page_number,
            page_end: c.page_end,
            content: c.content,
            token_estimate: Math.round(c.content.length / 4),
            embedding: embeddings[i] as unknown as string,
          }));

          for (let i = 0; i < rows.length; i += 20) {
            const { error } = await supabase.from("document_chunks").insert(rows.slice(i, i + 20));
            if (error) throw error;
          }

          await supabase
            .from("documents")
            .update({ status: "indexed", chunk_count: rows.length })
            .eq("id", documentId);

          report.push({ document: doc.title, id: documentId, chunks: rows.length });
        }

        return Response.json({ ok: true, report });
      },
    },
  },
});
