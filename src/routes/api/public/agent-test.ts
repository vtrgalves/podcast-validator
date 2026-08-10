/** Rota TEMPORÁRIA de teste de aceite da Fase B (somente localhost). */
import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { runAgentStream } from "@/lib/agent/core.server";

export const Route = createFileRoute("/api/public/agent-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const host = new URL(request.url).hostname;
        if (host !== "localhost" && host !== "127.0.0.1") {
          return new Response("Unauthorized", { status: 401 });
        }
        const { question } = (await request.json()) as { question: string };
        const apiKey = process.env["LOVABLE_API_KEY"]!;
        const messages: UIMessage[] = [
          { id: "u1", role: "user", parts: [{ type: "text", text: question }] },
        ];
        const res = await runAgentStream({ messages, env: { apiKey } });
        const text = await new Response(res.body).text();
        return new Response(text, { headers: { "content-type": "text/plain" } });
      },
    },
  },
});
