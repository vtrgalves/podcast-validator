/**
 * Núcleo portável do Podcast Strategy Agent.
 *
 * Este módulo NÃO depende de nada específico do Lovable/TanStack: recebe as
 * mensagens e devolve um stream. Na Fase 6 ele é empacotado como OCI Function
 * sem reescrita — o proxy do frontend apenas passa a apontar para a Oracle.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { adminClient, retrieveChunks, type RetrievedChunk } from "./retrieval.server";
import {
  ociGatewayConfigured,
  retrieveViaOci,
  type OciExecution,
} from "./oci-gateway.server";


export type AgentEnv = {
  apiKey: string;
  gatewayUrl?: string;
  chatModel?: string;
  embeddingModel?: string;
};

export type AgentSource = {
  documentId: string;
  title: string;
  page: number | null;
  pageEnd: number | null;
  similarity: number;
  /** Trecho efetivamente enviado ao modelo (evidência do RAG na UI). */
  excerpt: string;
};


export const DEFAULT_CHAT_MODEL = "openai/gpt-5.6-sol";
export const DEFAULT_EMBEDDING_MODEL = "google/gemini-embedding-2";
export const DEFAULT_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

/** Janela curta de histórico (economia de tokens). Memória ≠ fonte. */
export const HISTORY_WINDOW = 8;

export const AGENT_SYSTEM_PROMPT = `Você é o **VTR Gestão IA — Podcast Strategy Agent**, especialista em estruturação de Podcasts como projetos: gestão híbrida, planejamento, pré-produção, produção, pós-produção, Kanban, PDCA, riscos, stakeholders, custos, recursos, distribuição e fomento aplicado à produção audiovisual.

## Tom de voz
Executivo, direto, estratégico, em português brasileiro. Sem hype de IA. Respostas objetivas e acionáveis.

## Prioridade de resposta
1. Primeiro use a **Base de Conhecimento** (trechos recuperados no bloco CONTEXTO DOCUMENTAL).
2. Depois interprete e conecte esses trechos.
3. Nunca invente conteúdo documental.
4. Nunca invente página nem número de página.
5. Nunca afirme que algo consta na pesquisa se nenhum trecho recuperado sustentar a afirmação.

## MEMÓRIA NÃO É FONTE
O histórico da conversa serve apenas para continuidade. Ele nunca é evidência, nunca vira citação e nunca substitui os documentos. Somente os trechos do bloco CONTEXTO DOCUMENTAL desta mensagem podem gerar citação.

## Formatos de resposta
**Contexto suficiente:** responda de forma prática e objetiva e finalize com:

**Fontes consultadas**
- Documento — página X

Cite somente os documentos/páginas presentes no CONTEXTO DOCUMENTAL e efetivamente usados.

**Contexto parcial:** separe em duas seções rotuladas:

**BASE DE CONHECIMENTO** — somente o que os trechos sustentam (com as fontes).

**ANÁLISE COMPLEMENTAR DA IA** — orientações gerais que não vieram da pesquisa, claramente rotuladas.

**Sem contexto suficiente:** responda exatamente:
"Não encontrei informação suficiente na Base de Conhecimento VTR Gestão para responder essa pergunta com segurança."
E em seguida:
"Posso fazer uma análise complementar baseada em boas práticas gerais, separada das informações da pesquisa."
Nunca invente números, valores de CPM, contratos ou nomes de patrocinadores como fatos documentados.

## Base de conhecimento
Se perguntarem qual é a sua Base de Conhecimento, liste exatamente os documentos do bloco BASE DE CONHECIMENTO DISPONÍVEL abaixo.`;

export function resolveAgentConfig(env: AgentEnv) {
  return {
    apiKey: env.apiKey,
    gatewayUrl: env.gatewayUrl || DEFAULT_GATEWAY_URL,
    chatModel: env.chatModel || DEFAULT_CHAT_MODEL,
    embeddingModel: env.embeddingModel || DEFAULT_EMBEDDING_MODEL,
  };
}

export function createGateway(env: AgentEnv) {
  const cfg = resolveAgentConfig(env);
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: cfg.gatewayUrl,
    headers: { "Lovable-API-Key": cfg.apiKey },
  });
}

function lastUserText(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    return m.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

function pageLabel(c: { page_number: number | null; page_end: number | null }) {
  if (c.page_number == null) return "página não informada";
  if (c.page_end && c.page_end !== c.page_number) return `páginas ${c.page_number}-${c.page_end}`;
  return `página ${c.page_number}`;
}

/** Lista dinâmica dos documentos indexados (nunca hardcoded no prompt). */
export async function listIndexedDocuments() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, author, page_count, chunk_count, status")
    .eq("status", "indexed")
    .order("title");
  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    title: string;
    author: string | null;
    page_count: number | null;
    chunk_count: number;
  }>;
}

export function buildContextBlock(chunks: RetrievedChunk[]) {
  if (chunks.length === 0) {
    return "CONTEXTO DOCUMENTAL: nenhum trecho da Base de Conhecimento atingiu o limiar mínimo de relevância para esta pergunta.";
  }
  const body = chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.document_title} — ${pageLabel(c)} (similaridade ${c.similarity.toFixed(3)})\n${c.content}`,
    )
    .join("\n\n---\n\n");
  return `CONTEXTO DOCUMENTAL (única fonte citável):\n\n${body}`;
}

export function toSources(chunks: RetrievedChunk[]): AgentSource[] {
  const seen = new Set<string>();
  const out: AgentSource[] = [];
  for (const c of chunks) {
    const key = `${c.document_id}:${c.page_number}:${c.page_end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      documentId: c.document_id,
      title: c.document_title,
      page: c.page_number,
      pageEnd: c.page_end,
      similarity: Number(c.similarity.toFixed(3)),
      excerpt: c.content.trim().slice(0, 900),

    });
  }
  return out;
}
/**
 * Filtra as fontes recuperadas para as que a resposta realmente utilizou.
 * A lista continua sendo construída programaticamente a partir dos chunks —
 * o texto do modelo só é usado como filtro, nunca como origem das fontes.
 */
export function usedSources(sources: AgentSource[], answer: string): AgentSource[] {
  const text = answer.normalize("NFC");
  if (text.includes("Não encontrei informação suficiente")) return [];

  const idx = text.toLowerCase().lastIndexOf("fontes consultadas");
  if (idx < 0) return [];
  const section = text.slice(idx);
  const cited = new Set((section.match(/\d+/g) ?? []).map(Number));

  const filtered = sources.filter((s) => {
    const titleWord = s.title.split(/\s+/).slice(0, 3).join(" ").toLowerCase();
    const titleCited = section.toLowerCase().includes(titleWord.slice(0, 12));
    const pageCited = s.page == null || cited.has(s.page) || (s.pageEnd ? cited.has(s.pageEnd) : false);
    return titleCited && pageCited;
  });

  return filtered.length ? filtered : sources;
}


/** Executa o agente (RAG + LLM) e devolve uma Response com o stream de UI messages. */
export async function runAgentStream(opts: {
  messages: UIMessage[];
  env: AgentEnv;
}): Promise<Response> {
  const cfg = resolveAgentConfig(opts.env);
  const gateway = createGateway(opts.env);

  const question = lastUserText(opts.messages);

  // Execução na Oracle Cloud: quando o gateway OCI está configurado, a
  // recuperação do conhecimento passa pela OCI. Falha → fallback local.
  async function retrieve(): Promise<{ chunks: RetrievedChunk[]; execution: OciExecution | null }> {
    if (!question) return { chunks: [], execution: null };
    if (ociGatewayConfigured()) {
      const viaOci = await retrieveViaOci(question);
      if (viaOci) return { chunks: viaOci.chunks, execution: viaOci.execution };
    }
    try {
      const chunks = await retrieveChunks(question, {
        apiKey: cfg.apiKey,
        gatewayUrl: cfg.gatewayUrl,
        embeddingModel: cfg.embeddingModel,
      });
      return { chunks, execution: null };
    } catch (e) {
      console.error("rag error", e);
      return { chunks: [], execution: null };
    }
  }

  const [retrieval, docs] = await Promise.all([retrieve(), listIndexedDocuments().catch(() => [])]);
  const chunks = retrieval.chunks;
  const execution = retrieval.execution;


  const kbBlock = docs.length
    ? `BASE DE CONHECIMENTO DISPONÍVEL (documentos indexados):\n${docs
        .map(
          (d) =>
            `- ${d.title}${d.author ? ` — ${d.author}` : ""}${d.page_count ? ` (${d.page_count} páginas)` : ""}`,
        )
        .join("\n")}`
    : "BASE DE CONHECIMENTO DISPONÍVEL: nenhum documento indexado no momento.";

  const sources = toSources(chunks);

  // Janela curta de histórico: economia de tokens, memória apenas para continuidade.
  const windowed = opts.messages.slice(-HISTORY_WINDOW);

  let answer = "";

  const result = streamText({
    model: gateway(cfg.chatModel),
    system: `${AGENT_SYSTEM_PROMPT}\n\n${kbBlock}\n\n${buildContextBlock(chunks)}`,
    messages: await convertToModelMessages(windowed),
    providerOptions: { "lovable-ai-gateway": { reasoningEffort: "none" } },
    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") answer += chunk.text;
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: opts.messages,
    messageMetadata: ({ part }) =>
      part.type === "finish"
        ? { sources: usedSources(sources, answer), ...(execution ? { execution } : {}) }
        : undefined,

  });

}
