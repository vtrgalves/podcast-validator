import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Trash2, LogOut, Home, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createThread, deleteThread, listThreads } from "@/lib/threads.functions";

export function AgentShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const threads = useQuery({
    queryKey: ["threads"],
    queryFn: () => listThreads(),
  });

  const create = useMutation({
    mutationFn: () => createThread({ data: {} }),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/app/podcast-agent/$threadId", params: { threadId: thread.id } });
    },
    onError: () => toast.error("Não foi possível criar a conversa"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteThread({ data: { id } }),
    onSuccess: (_r, id) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) navigate({ to: "/app/podcast-agent" });
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-surface/40 md:flex">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="px-3">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Conversas
          </p>
          {threads.isLoading && (
            <p className="px-2 text-xs text-muted-foreground">Carregando…</p>
          )}
          {threads.data?.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">
              Nenhuma conversa ainda. Comece uma nova.
            </p>
          )}
          <ul className="space-y-1">
            {threads.data?.map((t) => {
              const active = pathname.endsWith(t.id);
              return (
                <li
                  key={t.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg px-1 transition-colors",
                    active ? "bg-surface-elevated" : "hover:bg-surface-elevated/60",
                  )}
                >
                  <Link
                    to="/app/podcast-agent/$threadId"
                    params={{ threadId: t.id }}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm"
                  >
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{t.title}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Excluir conversa ${t.title}`}
                    onClick={() => remove.mutate(t.id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border/60 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" /> Página inicial
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 md:hidden">
          <Link to="/">
            <Logo />
          </Link>
          <Button size="sm" className="ml-auto" onClick={() => create.mutate()}>
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
