import { BarChart3, Handshake, Lightbulb, Megaphone, Target, Users } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: "Validar minha ideia de podcast",
    prompt:
      "Quero validar uma ideia de podcast. Conduza a coleta de informações e me dê um diagnóstico estratégico.",
  },
  {
    icon: Megaphone,
    title: "Estratégia de monetização",
    prompt:
      "Quais modelos de monetização fazem mais sentido para um podcast de nicho B2B começando do zero?",
  },
  {
    icon: Handshake,
    title: "Como negociar com patrocinadores",
    prompt:
      "Como estruturar uma proposta comercial e negociar patrocínio para um podcast com audiência inicial?",
  },
  {
    icon: Target,
    title: "Posicionamento e diferenciação",
    prompt:
      "Meu nicho está saturado. Como encontrar um posicionamento diferenciado e defensável?",
  },
  {
    icon: Users,
    title: "Crescer audiência organicamente",
    prompt:
      "Quais alavancas de crescimento orgânico funcionam melhor para podcasts nos primeiros 6 meses?",
  },
  {
    icon: BarChart3,
    title: "Precificação de mídia",
    prompt:
      "Como precificar inserções e cotas de patrocínio de forma realista para o mercado brasileiro?",
  },
];

export function AgentWelcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <img
        src={logoMark}
        alt="VTR Gestão IA"
        className="h-14 w-14 rounded-2xl shadow-elevated"
      />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        Podcast Strategy Agent
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Consultoria estratégica de podcast fundamentada em documentos: mercado, monetização,
        patrocínio, audiência e viabilidade comercial.
      </p>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-surface/60 p-4 text-left transition-colors hover:border-primary/50 hover:bg-surface-elevated"
          >
            <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium">{s.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {s.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
