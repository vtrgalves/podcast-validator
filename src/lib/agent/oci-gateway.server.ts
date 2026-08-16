/**
 * Camada de execução do agente hospedada na Oracle Cloud Infrastructure.
 *
 * O gateway roda em OCI Compute (Always Free, região sa-saopaulo-1) e é quem
 * chama o backend/RAG. Quando OCI_AGENT_GATEWAY_URL está configurado, toda a
 * recuperação de conhecimento do chat passa pela Oracle Cloud.
 *
 * Rollback seguro: qualquer falha faz o núcleo voltar à recuperação local.
 */
import type { RetrievedChunk } from "./retrieval.server";

export type OciExecution = {
  gateway: string;
  region: string;
  latencyMs: number;
  invocation: number | null;
};

export type OciRetrieval = { chunks: RetrievedChunk[]; execution: OciExecution };

export function ociGatewayConfigured() {
  return Boolean(process.env["OCI_AGENT_GATEWAY_URL"] && process.env["AGENT_SHARED_SECRET"]);
}

/** Recupera os chunks através do gateway na OCI. Retorna null se indisponível. */
export async function retrieveViaOci(
  question: string,
  opts?: { topK?: number; timeoutMs?: number },
): Promise<OciRetrieval | null> {
  const url = process.env["OCI_AGENT_GATEWAY_URL"];
  if (!url) return null;

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, topK: opts?.topK }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("oci gateway status", res.status);
      return null;
    }
    const json = (await res.json()) as {
      chunks?: RetrievedChunk[];
      gateway?: string;
      region?: string;
      invocation?: number;
    };
    if (!Array.isArray(json.chunks)) return null;
    return {
      chunks: json.chunks,
      execution: {
        gateway: json.gateway ?? "oci-compute/podcast-agent-gateway",
        region: json.region ?? "sa-saopaulo-1",
        latencyMs: Date.now() - started,
        invocation: typeof json.invocation === "number" ? json.invocation : null,
      },
    };
  } catch (e) {
    console.error("oci gateway error", (e as Error).name);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
