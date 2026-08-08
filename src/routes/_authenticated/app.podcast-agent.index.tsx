import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AgentShell } from "@/components/agent/AgentShell";
import { createThread, listThreads } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/app/podcast-agent/")({
  head: () => ({
    meta: [
      { title: "Podcast Strategy Agent — VTR Gestão IA" },
      {
        name: "description",
        content:
          "Agente estratégico de podcasts da VTR Gestão: valide ideias, planeje monetização e prepare a negociação com patrocinadores.",
      },
      { property: "og:title", content: "Podcast Strategy Agent — VTR Gestão IA" },
      {
        property: "og:description",
        content: "Consultoria estratégica de podcast com IA fundamentada em documentos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentIndex,
});

function AgentIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const existing = await listThreads();
      const thread = existing[0] ?? (await createThread({ data: {} }));
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({
        to: "/app/podcast-agent/$threadId",
        params: { threadId: thread.id },
        replace: true,
      });
    })();
  }, [navigate, queryClient]);

  return (
    <AgentShell>
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Abrindo seu agente…
      </div>
    </AgentShell>
  );
}
