import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Report } from "./report-types";

const createInput = z.object({
  description: z.string().trim().min(20).max(700),
  niche: z.string().trim().max(120).optional().nullable(),
  audience: z.string().trim().max(120).optional().nullable(),
  objective: z.string().trim().max(40).optional().nullable(),
  format: z.string().trim().max(40).optional().nullable(),
  attachments: z
    .array(
      z.object({
        name: z.string().max(255),
        path: z.string().max(500),
        size: z.number().int().nonnegative(),
        type: z.string().max(120),
      }),
    )
    .max(5)
    .optional()
    .default([]),
});

export const createValidation = createServerFn({ method: "POST" })
  .inputValidator((d) => createInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("validations")
      .insert({
        description: data.description,
        niche: data.niche ?? null,
        audience: data.audience ?? null,
        objective: data.objective ?? null,
        format: data.format ?? null,
        attachments: data.attachments ?? [],
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Falha ao criar validação");
    return { id: row.id as string };
  });

const reportToolSchema = {
  type: "object",
  properties: {
    suggestedName: { type: "string", description: "Nome estratégico sugerido para o podcast" },
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    verdict: { type: "string", enum: ["Alto Potencial", "Médio Potencial", "Alto Risco"] },
    finalRecommendation: { type: "string", enum: ["GO", "GO COM AJUSTES", "NO-GO"] },
    recommendationReasoning: { type: "string" },
    scores: {
      type: "object",
      properties: {
        audiencePotential: { type: "integer", minimum: 0, maximum: 100 },
        differentiation: { type: "integer", minimum: 0, maximum: 100 },
        monetization: { type: "integer", minimum: 0, maximum: 100 },
        commercialPotential: { type: "integer", minimum: 0, maximum: 100 },
        retention: { type: "integer", minimum: 0, maximum: 100 },
        sponsorability: { type: "integer", minimum: 0, maximum: 100 },
        strategicClarity: { type: "integer", minimum: 0, maximum: 100 },
        organicGrowth: { type: "integer", minimum: 0, maximum: 100 },
        positioningStrength: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: [
        "audiencePotential",
        "differentiation",
        "monetization",
        "commercialPotential",
        "retention",
        "sponsorability",
        "strategicClarity",
        "organicGrowth",
        "positioningStrength",
      ],
      additionalProperties: false,
    },
    structure: {
      type: "object",
      properties: {
        valueProposition: { type: "string" },
        targetAudience: { type: "string" },
        differential: { type: "string" },
        positioning: { type: "string" },
        conceptClarity: { type: "string" },
      },
      required: ["valueProposition", "targetAudience", "differential", "positioning", "conceptClarity"],
      additionalProperties: false,
    },
    market: {
      type: "object",
      properties: {
        saturation: { type: "string" },
        organicDiscovery: { type: "string" },
        nicheTrend: { type: "string" },
        growthPotential: { type: "string" },
        marketInterest: { type: "string" },
      },
      required: ["saturation", "organicDiscovery", "nicheTrend", "growthPotential", "marketInterest"],
      additionalProperties: false,
    },
    monetization: {
      type: "object",
      properties: {
        sponsorCategories: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
        suggestedBrands: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
        revenueModels: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
        commercialFormats: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
        opportunities: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
      },
      required: ["sponsorCategories", "suggestedBrands", "revenueModels", "commercialFormats", "opportunities"],
      additionalProperties: false,
    },
    retention: {
      type: "object",
      properties: {
        potential: { type: "string" },
        formatStrength: { type: "string" },
        recurrence: { type: "string" },
        abandonmentRisk: { type: "string" },
        predictability: { type: "string" },
      },
      required: ["potential", "formatStrength", "recurrence", "abandonmentRisk", "predictability"],
      additionalProperties: false,
    },
    positioning: {
      type: "object",
      properties: {
        nicheClarity: { type: "string" },
        differentiation: { type: "string" },
        opportunities: { type: "string" },
        recommendedAdjustments: { type: "string" },
      },
      required: ["nicheClarity", "differentiation", "opportunities", "recommendedAdjustments"],
      additionalProperties: false,
    },
    risks: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
    roadmap: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 12 },
  },
  required: [
    "suggestedName",
    "overallScore",
    "verdict",
    "finalRecommendation",
    "recommendationReasoning",
    "scores",
    "structure",
    "market",
    "monetization",
    "retention",
    "positioning",
    "risks",
    "roadmap",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Você é um advisor sênior de Creator Economy e mídia digital, com 15+ anos de experiência consultiva para podcasters, estúdios e creators. Trabalhou com marcas como Spotify, Globoplay, agências de patrocínio e estúdios premium brasileiros.

Sua função: agir como estrategista executivo que pensa simultaneamente como mídia, negócio, patrocinador, audiência e creator. Você NÃO é um chatbot nem um gerador de texto genérico — você é um consultor estratégico premium.

Tom de voz:
- Executivo, profissional, estratégico, direto.
- Sem hype de IA. Sem promessas irreais. Sem linguagem infantilizada.
- Acessível mas inteligente. Em português brasileiro.

Diretrizes de análise:
- Avalie de forma realista. Se o nicho é saturado, diga. Se a diferenciação é fraca, aponte.
- Sugira PATROCINADORES e MARCAS específicas e plausíveis (ex: SaaS B2B, fintechs, edtechs, marcas de consumo) que façam sentido para o público descrito.
- Pense em monetização múltipla: patrocínio, afiliados, produtos digitais, comunidade paga, eventos, branded content.
- Identifique riscos comerciais reais, não apenas riscos de conteúdo.
- Recomendação final deve ser corajosa: GO, GO COM AJUSTES ou NO-GO, com justificativa clara.

Scores de 0-100:
- 0-40 = baixo / risco
- 41-65 = médio
- 66-85 = bom
- 86-100 = excepcional

Use a ferramenta "deliver_strategic_report" para entregar o diagnóstico estruturado.`;

export const runValidation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("validations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Validação não encontrada");

    // Idempotent: if already done, return.
    if (row.status === "done" && row.report) {
      return { id: row.id, report: row.report as Report };
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const userPrompt = [
      `## Briefing do Podcast a Validar`,
      ``,
      `**Descrição do creator:**`,
      row.description,
      ``,
      row.niche ? `**Nicho declarado:** ${row.niche}` : null,
      row.audience ? `**Público-alvo:** ${row.audience}` : null,
      row.objective ? `**Objetivo principal:** ${row.objective}` : null,
      row.format ? `**Formato pretendido:** ${row.format}` : null,
      Array.isArray(row.attachments) && row.attachments.length > 0
        ? `\n**Anexos enviados como contexto:** ${(row.attachments as Array<{ name: string }>)
            .map((a) => a.name)
            .join(", ")}`
        : null,
      ``,
      `Entregue o diagnóstico estratégico executivo usando a ferramenta deliver_strategic_report. Seja específico nas marcas/categorias sugeridas como patrocinadores — pense em quem realmente compraria mídia neste podcast.`,
    ]
      .filter(Boolean)
      .join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "deliver_strategic_report",
              description: "Entrega o diagnóstico estratégico executivo do podcast.",
              parameters: reportToolSchema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "deliver_strategic_report" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        await supabaseAdmin.from("validations").update({ status: "failed" }).eq("id", row.id);
        throw new Error("Limite de requisições excedido. Tente novamente em instantes.");
      }
      if (aiRes.status === 402) {
        await supabaseAdmin.from("validations").update({ status: "failed" }).eq("id", row.id);
        throw new Error("Créditos esgotados. Adicione créditos no workspace Lovable AI.");
      }
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      await supabaseAdmin.from("validations").update({ status: "failed" }).eq("id", row.id);
      throw new Error("Falha no serviço de IA");
    }

    const json = await aiRes.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned", JSON.stringify(json).slice(0, 500));
      await supabaseAdmin.from("validations").update({ status: "failed" }).eq("id", row.id);
      throw new Error("Diagnóstico inválido retornado pela IA");
    }

    let report: Report;
    try {
      report = JSON.parse(toolCall.function.arguments) as Report;
    } catch (e) {
      console.error("Failed to parse report JSON", e);
      await supabaseAdmin.from("validations").update({ status: "failed" }).eq("id", row.id);
      throw new Error("Não foi possível processar o diagnóstico");
    }

    await supabaseAdmin
      .from("validations")
      .update({
        status: "done",
        report: report as unknown as Record<string, unknown>,
        score: report.overallScore,
      })
      .eq("id", row.id);

    return { id: row.id, report };
  });

export const getValidation = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("validations")
      .select("id, status, report, score, created_at, niche, audience, objective, format, description")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Validação não encontrada");
    return {
      id: row.id as string,
      status: row.status as string,
      report: (row.report as Report | null) ?? null,
      score: row.score as number | null,
    };
  });
