import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Target, DollarSign } from "lucide-react";

export function ReportPreviewMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-gradient-brand opacity-20 blur-3xl rounded-full" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative glass rounded-2xl p-6 shadow-elevated"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Diagnóstico executivo</p>
            <p className="font-display text-lg font-semibold mt-1">Carreira em Tech BR</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-display font-bold text-gradient-brand leading-none">82</div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Score</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-success/15 text-success px-3 py-1 text-xs font-semibold mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Alto Potencial
        </div>

        <div className="space-y-3">
          {[
            { icon: TrendingUp, label: "Potencial de Audiência", value: 88, color: "from-[oklch(0.72_0.19_155)] to-[oklch(0.62_0.22_305)]" },
            { icon: Target, label: "Diferenciação", value: 76, color: "from-[oklch(0.62_0.22_305)] to-[oklch(0.70_0.20_340)]" },
            { icon: DollarSign, label: "Monetização", value: 81, color: "from-[oklch(0.70_0.20_340)] to-[oklch(0.78_0.16_75)]" },
            { icon: Sparkles, label: "Patrocinabilidade", value: 84, color: "from-[oklch(0.62_0.22_305)] to-[oklch(0.72_0.19_155)]" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold tabular-nums">{m.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${m.color}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-border/60">
          <p className="text-xs text-muted-foreground mb-2">Patrocinadores sugeridos</p>
          <div className="flex flex-wrap gap-1.5">
            {["SaaS B2B", "Fintechs", "Edtechs", "Creator Tools", "Carreira"].map((t) => (
              <span key={t} className="text-[11px] px-2 py-1 rounded-md bg-surface-elevated border border-border/60 text-foreground/80">
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
