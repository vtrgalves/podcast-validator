import { createFileRoute } from "@tanstack/react-router";
import { runAgentStream } from "@/lib/agent/core.server";

export const Route = createFileRoute("/api/public/agent-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const host = new URL(request.url).hostname;
        if (host !== "localhost" && host !== "127.0.0.1") {
          return new Response("Unauthorized", { status: 401 });
        }
        const { q } = (await request.json()) as { q: string };
        return runAgentStream({
          messages: [
            { id: "1", role: "user", parts: [{ type: "text", text: q }] },
          ] as never,
          env: { apiKey: process.env["LOVABLE_API_KEY"]! },
        });
      },
    },
  },
});
