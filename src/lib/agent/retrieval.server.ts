/**
 * Recuperação (RAG) da Base de Conhecimento.
 *
 * Regra central: MEMÓRIA ≠ FONTE. Somente chunks recuperados aqui podem ser
 * citados em "Fontes consultadas". Histórico de conversa nunca é fonte.
 */
import { createClient } from "@supabase/supabase-js";

export const EMBEDDING_MODEL = "google/gemini-embedding-2";
export const EMBEDDING_DIMS = 3072;
export const TOP_K = 8;
export const MAX_CHUNKS_PER_DOCUMENT = 4;
export const SIMILARITY_THRESHOLD = 0.45;

export type RetrievedChunk = {
  id: string;
  document_id: string;
  document_title: string;
  page_number: number | null;
  page_end: number | null;
  chunk_index: number;
  content: string;
  similarity: number;
};

export function adminClient() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function embedTexts(
  texts: string[],
  opts: { apiKey: string; gatewayUrl?: string; model?: string },
): Promise<number[][]> {
  const base = opts.gatewayUrl || "https://ai.gateway.lovable.dev/v1";
  const model = opts.model || EMBEDDING_MODEL;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({ model, input: batch }),
    });
    if (!res.ok) throw new Error(`embeddings ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data: Array<{ index: number; embedding: number[] }> };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    for (const d of sorted) out.push(d.embedding);
  }
  return out;
}

/** Similaridade de cosseno entre dois vetores normalizados ou não. */
function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** Similaridade lexical simples (Jaccard) para deduplicar chunks equivalentes. */
function lexicalOverlap(a: string, b: string) {
  const norm = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4),
    );
  const sa = norm(a);
  const sb = norm(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

/**
 * Busca semântica com limiar, teto por documento e deduplicação semântica.
 */
export async function retrieveChunks(
  query: string,
  opts: { apiKey: string; gatewayUrl?: string; embeddingModel?: string; topK?: number },
): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? TOP_K;
  const [queryEmbedding] = await embedTexts([query], {
    apiKey: opts.apiKey,
    gatewayUrl: opts.gatewayUrl,
    model: opts.embeddingModel,
  });
  if (!queryEmbedding) return [];

  const supabase = adminClient();
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding as unknown as string,
    match_count: topK * 3,
    similarity_threshold: SIMILARITY_THRESHOLD,
  });
  if (error) throw error;

  const candidates = (data ?? []) as RetrievedChunk[];
  const perDoc = new Map<string, number>();
  const kept: RetrievedChunk[] = [];

  for (const c of candidates) {
    if (kept.length >= topK) break;
    const used = perDoc.get(c.document_id) ?? 0;
    if (used >= MAX_CHUNKS_PER_DOCUMENT) continue;
    // evita enviar dois chunks semanticamente equivalentes ao LLM
    if (kept.some((k) => lexicalOverlap(k.content, c.content) >= 0.6)) continue;
    kept.push(c);
    perDoc.set(c.document_id, used + 1);
  }
  return kept;
}

export { cosine, lexicalOverlap };
