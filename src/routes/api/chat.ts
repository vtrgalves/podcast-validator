import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { runAgentStream } from "@/lib/agent/core.server";

/**
 * Proxy fino do agente.
 *
 * Hoje executa o núcleo do agente localmente. Quando AGENT_ENDPOINT_URL estiver
 * configurado (Fase 6), a execução acontece na OCI Function via API Gateway e
 * esta rota apenas repassa a chamada — nenhuma credencial Oracle no frontend.
 */
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: unknown; id?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const messages = body.messages as UIMessage[];

        const remote = process.env["AGENT_ENDPOINT_URL"];
        if (remote) {
          const res = await fetch(remote, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-agent-secret": process.env["AGENT_SHARED_SECRET"] ?? "",
              "x-user-token": token,
            },
            body: JSON.stringify({ messages, threadId: body.id }),
          });
          return new Response(res.body, {
            status: res.status,
            headers: {
              "content-type": res.headers.get("content-type") ?? "text/event-stream",
            },
          });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          return await runAgentStream({
            messages,
            env: {
              apiKey,
              gatewayUrl: process.env["AI_GATEWAY_URL"],
              chatModel: process.env["CHAT_MODEL"],
              embeddingModel: process.env["EMBEDDING_MODEL"],
            },
          });
        } catch (error) {
          console.error("agent error", error);
          return new Response("Falha ao consultar o agente", { status: 500 });
        }
      },
    },
  },
});
