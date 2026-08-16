import { createFileRoute } from "@tanstack/react-router";
import { retrieveChunks } from "@/lib/agent/retrieval.server";

/**
 * Endpoint de recuperação (RAG) consumido pela camada de execução hospedada na
 * Oracle Cloud Infrastructure (OCI Compute — Podcast Agent Gateway).
 *
 * Protegido por segredo compartilhado server-side (AGENT_SHARED_SECRET).
 * Nenhuma credencial trafega para o frontend.
 */
export const Route = createFileRoute("/api/public/agent-retrieve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["AGENT_SHARED_SECRET"];
        if (!secret) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }
        if (request.headers.get("x-agent-secret") !== secret) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        let payload: { question?: unknown; topK?: unknown };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const question = typeof payload.question === "string" ? payload.question.trim() : "";
        if (!question) {
          return Response.json({ error: "invalid_request" }, { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "not_configured" }, { status: 503 });

        try {
          const chunks = await retrieveChunks(question, {
            apiKey,
            ...(typeof payload.topK === "number" ? { topK: payload.topK } : {}),
          });
          return Response.json({ chunks });
        } catch (e) {
          console.error("agent-retrieve error", e);
          return Response.json({ error: "retrieval_failed" }, { status: 500 });
        }
      },
    },
  },
});
