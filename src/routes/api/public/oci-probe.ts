import { createFileRoute } from "@tanstack/react-router";
import { getOciConfig, ociRequest } from "@/lib/oci/object-storage.server";

export const Route = createFileRoute("/api/public/oci-probe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const host = new URL(request.url).hostname;
        if (host !== "localhost" && host !== "127.0.0.1") {
          return new Response("Unauthorized", { status: 401 });
        }
        const cfg = getOciConfig();
        if (!cfg) return new Response("not configured", { status: 400 });
        const ns = await ociRequest(cfg, "GET", "/n/");
        const nsName = ns.ok ? ((await ns.json()) as string) : null;
        const buckets = await ociRequest(
          cfg,
          "GET",
          `/n/${encodeURIComponent(nsName ?? cfg.namespace)}/b/?compartmentId=${encodeURIComponent(cfg.tenancy)}&limit=100`,
        );
        const bText = await buckets.text();
        return Response.json({
          namespace: nsName,
          bucketsStatus: buckets.status,
          buckets: bText.slice(0, 2000),
        });
      },
    },
  },
});
