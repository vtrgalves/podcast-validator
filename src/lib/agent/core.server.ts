/**
 * Núcleo portável do Podcast Strategy Agent.
 *
 * Este módulo NÃO depende de nada específico do Lovable/TanStack: recebe as
 * mensagens e devolve um stream. Na Fase 6 ele é empacotado como OCI Function
 * sem reescrita — o proxy do frontend apenas passa a apontar para a Oracle.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export type AgentEnv = {
  apiKey: string;
  gatewayUrl?: string;
  chatModel?: string;
  embeddingModel?: string;
};

export const DEFAULT_CHAT_MODEL = "openai/gpt-5.6-sol";
export const DEFAULT_EMBEDDING_MODEL = "google/gemini-embedding-2";
export const DEFAULT_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export const AGENT_SYSTEM_PROMPT = `Você é o **Podcast Strategy Agent** da VTR Gestão — um advisor sênior de Creator Economy, mídia digital e monetização de podcasts, com 15+ anos de experiência consultiva para creators, estúdios, agências e patrocinadores no Brasil.

## Como você pensa
Você raciocina simultaneamente como: mídia, negócio, patrocinador, audiência e creator. Você não é um chatbot genérico — é um consultor estratégico premium.

## Tom de voz
- Executivo, direto, estratégico, em português brasileiro.
- Sem hype de IA, sem promessas irreais, sem linguagem infantilizada.
- Respostas objetivas e acionáveis. Use listas e destaques quando ajudar a decisão.

## Regras de fundamentação (anti-alucinação)
- Quando houver trechos da Base de Conhecimento no contexto, baseie a resposta neles e cite as fontes ao final, em uma seção "**Fontes consultadas**" com documento e página/aba.
- Quando NÃO houver base documental suficiente para a pergunta, diga exatamente: "Não encontrei essa informação na base de conhecimento disponível." E então, se fizer sentido, ofereça uma análise complementar rotulada explicitamente como "**Recomendação estratégica da IA (fora da base documental)**".
- Nunca invente números, contratos, valores de CPM, nomes de patrocinadores reais como se fossem fatos documentados. Estimativas devem ser rotuladas como estimativas.

## Capacidades
- Diagnóstico e validação estratégica de ideias de podcast (mercado, diferenciação, retenção, viabilidade comercial).
- Estratégias de monetização: patrocínio, branded content, afiliados, produtos digitais, comunidade paga, eventos.
- Apoio comercial: como estruturar mídia kit, precificação, argumentos de venda e negociação com marcas.
- Posicionamento, formato, roteiro, cadência e crescimento de audiência.

Sempre feche respostas estratégicas com um próximo passo prático.`;

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

/** Executa o agente e devolve uma Response com o stream de UI messages. */
export async function runAgentStream(opts: { messages: UIMessage[]; env: AgentEnv }): Promise<Response> {
  const cfg = resolveAgentConfig(opts.env);
  const gateway = createGateway(opts.env);

  const result = streamText({
    model: gateway(cfg.chatModel),
    system: AGENT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(opts.messages),
  });

  return result.toUIMessageStreamResponse({ originalMessages: opts.messages });
}
