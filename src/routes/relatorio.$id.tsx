import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Compass,
  AlertTriangle,
  ListChecks,
  Award,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LeadDialog } from "@/components/LeadDialog";
import { Button } from "@/components/ui/button";
import { getValidation } from "@/lib/validate.functions";
import { SCORE_LABELS, type Report, type ReportScores } from "@/lib/report-types";

export const Route = createFileRoute("/relatorio/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Diagnóstico Estratégico — VTR Gestão IA" },
      { name: "description", content: "Relatório executivo com mercado, monetização, retenção e roadmap estratégico." },
      { property: "og:title", content: "Diagnóstico Estratégico — VTR Gestão IA" },
      { property: "og:url", content: `/relatorio/${params.id}` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `/relatorio/${params.id}` }],
  }),
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(validationQO(params.id)),
  component: RelatorioPage,
});

export const validationQO = (id: string) =>
  queryOptions({
    queryKey: ["validation", id],
    queryFn: () => getValidation({ data: { id } }),
  });

function RelatorioPage() {
  const { id } = Route.useParams();
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>}>
      <Inner id={id} />
    </Suspense>
  );
}

function Inner({ id }: { id: string }) {
  const { data } = useSuspenseQuery(validationQO(id));

  if (!data.report) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Diagnóstico ainda não disponível</h1>
          <p className="mt-2 text-muted-foreground text-sm">Tente novamente em alguns instantes.</p>
          <Link to="/validar" className="mt-6 inline-flex rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Nova validação
          </Link>
        </div>
      </div>
    );
  }

  const r = data.report;
  const verdictColor =
    r.verdict === "Alto Potencial" ? "success" : r.verdict === "Médio Potencial" ? "warning" : "destructive";

  const radarData = (Object.keys(r.scores) as Array<keyof ReportScores>).map((k) => ({
    metric: SCORE_LABELS[k].split(" ").slice(0, 2).join(" "),
    value: r.scores[k],
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/70 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo className="h-8" /></Link>
          <Link to="/validar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Nova validação
          </Link>
        </div>
      </header>

      {/* HERO HEADER */}
      <section className="bg-hero border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-xs uppercase tracking-widest text-primary/90 font-semibold">Diagnóstico estratégico executivo</p>
          <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{r.suggestedName}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full bg-${verdictColor}/15 text-${verdictColor} px-3 py-1.5 text-xs font-semibold border border-${verdictColor}/30`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-${verdictColor}`} /> {r.verdict}
                </span>
                <span className="inline-flex rounded-full bg-surface border border-border px-3 py-1.5 text-xs font-semibold">
                  Recomendação: {r.finalRecommendation}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-6xl md:text-7xl font-bold text-gradient-brand leading-none tabular-nums">
                {r.overallScore}
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Score executivo</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        {/* RADAR + SCORES */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-semibold text-lg mb-1">Métricas executivas</h2>
            <p className="text-xs text-muted-foreground mb-4">Visão estratégica multi-dimensional</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.35 0.04 265)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.75 0.02 255)", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="oklch(0.62 0.22 305)" fill="oklch(0.62 0.22 305)" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Scorecards</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(r.scores) as Array<keyof ReportScores>).map((k) => (
                <ScoreBar key={k} label={SCORE_LABELS[k]} value={r.scores[k]} />
              ))}
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card icon={Layers} title="Estrutura do Podcast">
            <Row label="Proposta de valor" v={r.structure.valueProposition} />
            <Row label="Público-alvo" v={r.structure.targetAudience} />
            <Row label="Diferencial percebido" v={r.structure.differential} />
            <Row label="Posicionamento" v={r.structure.positioning} />
            <Row label="Clareza do conceito" v={r.structure.conceptClarity} />
          </Card>

          <Card icon={TrendingUp} title="Potencial de Mercado">
            <Row label="Saturação" v={r.market.saturation} />
            <Row label="Descoberta orgânica" v={r.market.organicDiscovery} />
            <Row label="Tendência do nicho" v={r.market.nicheTrend} />
            <Row label="Potencial de crescimento" v={r.market.growthPotential} />
            <Row label="Interesse do mercado" v={r.market.marketInterest} />
          </Card>

          <Card icon={DollarSign} title="Potencial de Monetização">
            <TagBlock label="Categorias de patrocinadores" items={r.monetization.sponsorCategories} />
            <TagBlock label="Marcas sugeridas" items={r.monetization.suggestedBrands} />
            <TagBlock label="Modelos de receita" items={r.monetization.revenueModels} />
            <TagBlock label="Formatos comerciais" items={r.monetization.commercialFormats} />
            <TagBlock label="Oportunidades" items={r.monetization.opportunities} />
          </Card>

          <Card icon={Users} title="Retenção e Audiência">
            <Row label="Potencial de retenção" v={r.retention.potential} />
            <Row label="Força do formato" v={r.retention.formatStrength} />
            <Row label="Recorrência" v={r.retention.recurrence} />
            <Row label="Risco de abandono" v={r.retention.abandonmentRisk} />
            <Row label="Previsibilidade de audiência" v={r.retention.predictability} />
          </Card>

          <Card icon={Compass} title="Posicionamento Estratégico">
            <Row label="Clareza do nicho" v={r.positioning.nicheClarity} />
            <Row label="Diferenciação" v={r.positioning.differentiation} />
            <Row label="Oportunidades" v={r.positioning.opportunities} />
            <Row label="Ajustes recomendados" v={r.positioning.recommendedAdjustments} />
          </Card>

          <Card icon={AlertTriangle} title="Riscos">
            <ul className="space-y-2.5">
              {r.risks.map((x, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{x}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card icon={ListChecks} title="Roadmap Estratégico" wide>
            <ol className="space-y-2.5">
              {r.roadmap.map((x, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="h-6 w-6 rounded-md bg-surface-elevated border border-border grid place-items-center text-xs font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-foreground/90 pt-0.5">{x}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card icon={Award} title="Recomendação Final" wide accent>
            <div className="text-center py-4">
              <div className="inline-flex rounded-full bg-gradient-brand px-6 py-2 text-sm font-bold text-primary-foreground shadow-elevated mb-4">
                {r.finalRecommendation}
              </div>
              <p className="text-foreground/90 leading-relaxed max-w-2xl mx-auto">
                {r.recommendationReasoning}
              </p>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-surface to-card p-10 text-center shadow-elevated">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            Pronto para transformar este diagnóstico em <span className="text-gradient-brand">execução</span>?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A VTR Gestão estrutura crescimento, monetização e parcerias para creators que querem operar como negócio de mídia.
          </p>
          <LeadDialog
            validationId={id}
            trigger={
              <Button className="mt-6 bg-success text-success-foreground hover:bg-success/90 h-12 px-8 text-sm font-semibold shadow-elevated">
                Falar com a VTR Gestão
              </Button>
            }
          />
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">
          Diagnóstico gerado por inteligência estratégica — não substitui consultoria humana especializada.
        </p>
      </main>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children, wide, accent }: { icon: typeof Layers; title: string; children: React.ReactNode; wide?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border ${accent ? "border-primary/40 shadow-glow" : "border-border"} bg-card p-6 ${wide ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-lg bg-gradient-brand grid place-items-center shadow-soft">
          <Icon className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{v}</p>
    </div>
  );
}

function TagBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t, i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-surface-elevated border border-border/60 text-foreground/85">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
