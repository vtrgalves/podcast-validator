import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Cloud, CloudOff, FileText } from "lucide-react";
import { AgentShell } from "@/components/agent/AgentShell";
import { Badge } from "@/components/ui/badge";
import { getKnowledgeBase } from "@/lib/knowledge.functions";

export const Route = createFileRoute("/_authenticated/app/base-conhecimento")({
  head: () => ({
    meta: [
      { title: "Base de Conhecimento — VTR Gestão IA" },
      {
        name: "description",
        content:
          "Documentos indexados que fundamentam as análises do Podcast Strategy Agent da VTR Gestão.",
      },
      { property: "og:title", content: "Base de Conhecimento — VTR Gestão IA" },
      {
        property: "og:description",
        content: "Documentos que fundamentam o Podcast Strategy Agent.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KnowledgePage,
});

const STEPS = [
  "O usuário faz uma pergunta.",
  "O agente realiza busca semântica.",
  "Recupera trechos relevantes.",
  "A IA utiliza os trechos como contexto.",
  "A resposta apresenta as fontes consultadas.",
];

function KnowledgePage() {
  const kb = useQuery({ queryKey: ["knowledge-base"], queryFn: () => getKnowledgeBase() });

  const docs = kb.data?.documents ?? [];
  const oci = kb.data?.oci;

  return (
    <AgentShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Base de Conhecimento</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Estes documentos formam a Base de Conhecimento utilizada pelo Podcast Strategy Agent
            para fundamentar suas análises.
          </p>

          <div className="mt-6 space-y-3">
            {kb.isLoading && (
              <p className="text-sm text-muted-foreground">Carregando documentos…</p>
            )}
            {!kb.isLoading && docs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum documento indexado.</p>
            )}
            {docs.map((d) => (
              <article
                key={d.id}
                className="rounded-xl border border-border/60 bg-surface/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium">{d.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.author ?? "Autor não informado"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <Badge variant="secondary">{d.category ?? "Documento"}</Badge>
                      <Badge variant="secondary">{d.docType.toUpperCase()}</Badge>
                      <Badge variant="secondary">
                        {d.pageCount ?? "—"} páginas
                      </Badge>
                      <Badge variant="secondary">{d.chunkCount} trechos</Badge>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Indexado
                      </span>
                      {d.ociStored ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                          <Cloud className="h-3 w-3" /> Arquivo original no Oracle Cloud
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                          <CloudOff className="h-3 w-3" /> Oracle Cloud não configurado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-border/60 bg-surface/40 p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Como funciona
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="text-primary">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-6 rounded-xl border border-border/60 bg-surface/40 p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Oracle Cloud Infrastructure
            </h2>
            {oci?.connected ? (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Cloud className="h-4 w-4 text-primary" />
                Oracle Cloud conectado — bucket <strong>{oci.bucket}</strong> ({oci.region}),{" "}
                {oci.objects.length} objeto(s) armazenado(s).
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <CloudOff className="mt-0.5 h-4 w-4" />
                <span>
                  Oracle Cloud não configurado
                  {oci?.error ? " — falha de conexão ao Object Storage." : "."}{" "}
                  {oci && oci.missingEnv.length > 0 && (
                    <>Variáveis pendentes: {oci.missingEnv.join(", ")}.</>
                  )}
                </span>
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Os arquivos originais ficam no OCI Object Storage; a recuperação semântica usa o
              índice vetorial; o LLM apenas gera a resposta com base nos trechos recuperados.
            </p>
          </section>

          <div className="mt-8">
            <Link
              to="/app/podcast-agent"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Voltar ao agente
            </Link>
          </div>
        </div>
      </div>
    </AgentShell>
  );
}
