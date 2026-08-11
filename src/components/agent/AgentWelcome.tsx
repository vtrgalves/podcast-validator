import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Coins,
  KanbanSquare,
  Layers,
  RefreshCcw,
  Timer,
  Users,
  Workflow,
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";

const SUGGESTIONS = [
  { icon: Layers, prompt: "Como estruturar meu podcast como um projeto?" },
  { icon: KanbanSquare, prompt: "Como usar Kanban na produção?" },
  { icon: Timer, prompt: "Como reduzir atrasos e gargalos?" },
  { icon: Workflow, prompt: "Como organizar as etapas de produção?" },
  { icon: AlertTriangle, prompt: "Como identificar riscos?" },
  { icon: Coins, prompt: "Como organizar custos e recursos?" },
  { icon: Users, prompt: "Como trabalhar stakeholders e parceiros?" },
  { icon: RefreshCcw, prompt: "Como aplicar PDCA no podcast?" },
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
        Transforme conhecimento sobre gestão de podcasts em decisões práticas para planejamento,
        produção, riscos e crescimento.
      </p>

      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs text-primary">
        <BookOpen className="h-3.5 w-3.5" />
        Respostas fundamentadas na Base de Conhecimento VTR Gestão.
      </p>

      <Link
        to="/app/base-conhecimento"
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Ver Base de Conhecimento
      </Link>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.prompt}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-surface/60 p-4 text-left transition-colors hover:border-primary/50 hover:bg-surface-elevated"
          >
            <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">{s.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
