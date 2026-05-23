import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Target,
  DollarSign,
  TrendingDown,
  BarChart3,
  Search,
  Brain,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ReportPreviewMock } from "@/components/ReportPreviewMock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VTR Gestão IA — Valide seu podcast antes de investir" },
      {
        name: "description",
        content:
          "Inteligência estratégica para podcasters: diagnostique mercado, monetização, patrocinabilidade e potencial de audiência antes de produzir.",
      },
      { property: "og:title", content: "VTR Gestão IA — Podcast Strategy Validator" },
      {
        property: "og:description",
        content:
          "Plataforma premium de validação estratégica para podcasts e creator economy.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const problems = [
  { icon: Target, title: "Não sei se meu podcast tem diferencial.", body: "Você está prestes a entrar em um mercado com milhares de shows. Sem clareza de proposta, vira ruído." },
  { icon: AlertTriangle, title: "Tenho medo de entrar num nicho saturado.", body: "Nichos lotados exigem ângulo único e budget de mídia que a maioria não tem." },
  { icon: DollarSign, title: "Não sei como monetizar.", body: "Audiência sem modelo comercial é hobby. Receita exige arquitetura desde o dia zero." },
  { icon: Sparkles, title: "Não sei como conseguir patrocinadores.", body: "Marcas compram tese, não promessa. Sem media kit estratégico, não há proposta para apresentar." },
  { icon: BarChart3, title: "É difícil transformar audiência em negócio.", body: "Engajamento alto não paga conta. Falta funil, oferta e posicionamento comercial." },
  { icon: TrendingDown, title: "As métricas só aparecem depois que já investi muito.", body: "Quando o churn aparece, você já queimou meses de produção, edição e branding." },
];

const steps = [
  { icon: Search, title: "Descreva sua ideia", body: "Tema, formato, público e objetivo. Em até 700 caracteres." },
  { icon: Brain, title: "A IA analisa o mercado", body: "Saturação, diferenciação, retenção, crescimento e monetização — em paralelo." },
  { icon: FileCheck, title: "Receba um diagnóstico estratégico", body: "Score executivo, riscos, oportunidades, sugestões de patrocínio e roadmap." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo className="h-8" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#problemas" className="hover:text-foreground transition">Problemas</a>
            <a href="#como-funciona" className="hover:text-foreground transition">Como funciona</a>
            <a href="#diferencial" className="hover:text-foreground transition">Diferencial</a>
          </nav>
          <Link
            to="/validar"
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground hover:opacity-90 transition shadow-soft"
          >
            Validar meu Podcast <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-hero overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted-foreground mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Inteligência estratégica para creators
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight"
            >
              Valide seu podcast{" "}
              <span className="text-gradient-brand">antes de investir</span> meses produzindo.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Descubra potencial de audiência, monetização, posicionamento e oportunidades estratégicas antes de lançar seu podcast.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/validar"
                className="inline-flex items-center gap-2 rounded-lg bg-success px-6 py-3 text-sm font-semibold text-success-foreground hover:opacity-90 transition shadow-elevated"
              >
                Validar meu Podcast <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#diferencial"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-6 py-3 text-sm font-medium hover:bg-surface-elevated transition"
              >
                Ver análise exemplo
              </a>
            </motion.div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "9", v: "scores executivos" },
                { k: "8", v: "cards de análise" },
                { k: "<15s", v: "para diagnóstico" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-2xl font-bold text-foreground">{s.k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <ReportPreviewMock />
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section id="problemas" className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-widest text-primary/90 font-semibold mb-3">Realidade do mercado</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Por que 90% dos podcasts param em poucos episódios.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Não é falta de talento. É falta de validação estratégica antes da produção.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition group"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-brand grid place-items-center mb-4 shadow-glow">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-24 border-t border-border/60 bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-widest text-primary/90 font-semibold mb-3">Como funciona</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Diagnóstico executivo em 3 etapas.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-card p-7">
                <div className="absolute -top-3 -left-3 h-9 w-9 rounded-lg bg-gradient-brand grid place-items-center text-sm font-bold text-primary-foreground shadow-elevated">
                  {i + 1}
                </div>
                <s.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR */}
      <section id="diferencial" className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/90 font-semibold mb-3">Diferencial</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Não é só análise de conteúdo. É análise de <span className="text-gradient-brand">negócio de mídia</span>.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              A VTR Gestão IA pensa simultaneamente como creator, como mídia, como audiência e como patrocinador. O resultado é uma tese executiva que você pode levar para investidores, marcas e parceiros.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Modelo de mídia e posicionamento de marca",
                "Potencial comercial e categorias de patrocínio",
                "Estratégia de creator economy multi-receita",
                "Viabilidade do podcast como negócio",
                "Roadmap operacional realista",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <ReportPreviewMock />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/60 bg-hero">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Pare de adivinhar. <span className="text-gradient-brand">Comece a decidir.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Diagnóstico executivo em menos de 15 segundos. Sem cartão. Sem cadastro.
          </p>
          <Link
            to="/validar"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-success px-8 py-4 text-base font-semibold text-success-foreground hover:opacity-90 transition shadow-elevated"
          >
            Validar meu Podcast agora <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo className="h-7" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VTR Gestão. Inteligência estratégica para creators.
          </p>
        </div>
      </footer>
    </div>
  );
}
