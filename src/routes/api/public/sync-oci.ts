/**
 * Rota administrativa: envia os PDFs originais da Base de Conhecimento para o
 * OCI Object Storage e verifica a correspondência com os documentos indexados.
 *
 * Server-only, protegida por segredo compartilhado. Nenhuma credencial OCI é
 * retornada na resposta.
 */
import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "fs/promises";
import { adminClient } from "@/lib/agent/retrieval.server";
import { getOciConfig, missingOciEnv, headObject, putObject } from "@/lib/oci/object-storage.server";

export const Route = createFileRoute("/api/public/sync-oci")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INDEX_ADMIN_SECRET"] ?? "";
        const host = new URL(request.url).hostname;
        const isLocal = host === "localhost" || host === "127.0.0.1";
        if (!isLocal && (!secret || request.headers.get("x-admin-secret") !== secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const cfg = getOciConfig();
        if (!cfg) {
          return Response.json(
            { ok: false, configured: false, missingEnv: missingOciEnv() },
            { status: 400 },
          );
        }

        const supabase = adminClient();
        const { data, error } = await supabase
          .from("documents")
          .select("id, file_name, oci_object_name")
          .eq("status", "indexed");
        if (error) return new Response(error.message, { status: 500 });

        const results: Array<Record<string, unknown>> = [];
        for (const doc of data ?? []) {
          const objectName = doc.oci_object_name as string | null;
          if (!objectName) {
            results.push({ file: doc.file_name, skipped: "sem oci_object_name" });
            continue;
          }
          try {
            const already = await headObject(cfg, objectName);
            if (already.exists) {
              results.push({ object: objectName, uploaded: false, exists: true });
              continue;
            }
            const bytes = await readFile(`knowledge/pdf/${doc.file_name}`);
            await putObject(cfg, objectName, new Uint8Array(bytes));
            results.push({ object: objectName, uploaded: true, bytes: bytes.byteLength });
          } catch (e) {
            results.push({
              object: objectName,
              error: e instanceof Error ? e.message : "falha desconhecida",
            });
          }
        }

        return Response.json({ ok: true, bucket: cfg.bucket, results });
      },
    },
  },
});
