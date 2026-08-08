import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { AgentShell } from "@/components/agent/AgentShell";
import { ChatWindow } from "@/components/agent/ChatWindow";
import { getThreadMessages } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/app/podcast-agent/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversa — Podcast Strategy Agent | VTR Gestão IA" },
      {
        name: "description",
        content:
          "Conversa estratégica com o Podcast Strategy Agent da VTR Gestão sobre mercado, monetização e patrocínio.",
      },
      { property: "og:title", content: "Conversa — Podcast Strategy Agent" },
      {
        property: "og:description",
        content: "Consultoria estratégica de podcast com IA.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();

  const messages = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getThreadMessages({ data: { threadId } }),
    staleTime: Infinity,
  });

  return (
    <AgentShell>
      {messages.isLoading ? (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          Carregando conversa…
        </div>
      ) : (
        <ChatWindow
          key={threadId}
          threadId={threadId}
          initialMessages={(messages.data ?? []) as unknown as UIMessage[]}
          isNewThread={(messages.data ?? []).length === 0}
        />
      )}
    </AgentShell>
  );
}
