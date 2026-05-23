import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { runValidation } from "@/lib/validate.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/processando/$id")({
  head: () => ({
    meta: [
      { title: "Processando diagnóstico — VTR Gestão IA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProcessandoPage,
});

const MESSAGES = [
  "Analisando diferenciação do nicho…",
  "Identificando potencial de retenção…",
  "Calculando potencial de monetização…",
  "Mapeando oportunidades de parceria…",
  "Analisando saturação do mercado…",
  "Avaliando patrocinabilidade do projeto…",
  "Estruturando recomendação executiva…",
  "Gerando diagnóstico estratégico…",
];

function ProcessandoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const run = useServerFn(runValidation);
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const msgT = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1800);
    const progT = setInterval(() => setProgress((p) => Math.min(p + 2 + Math.random() * 4, 92)), 600);
    return () => {
      clearInterval(msgT);
      clearInterval(progT);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    run({ data: { id } })
      .then(() => {
        if (cancelled) return;
        setProgress(100);
        setTimeout(() => navigate({ to: "/relatorio/$id", params: { id } }), 400);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        toast.error(e?.message ?? "Falha ao gerar diagnóstico");
        setTimeout(() => navigate({ to: "/validar" }), 1200);
      });
    return () => { cancelled = true; };
  }, [id, run, navigate]);

  return (
    <div className="min-h-screen bg-background bg-hero flex flex-col">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="max-w-5xl mx-auto"><Logo className="h-8" /></div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          {/* Pulsing orb */}
          <div className="relative h-40 w-40 mx-auto mb-10">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gradient-brand blur-2xl"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border-2 border-primary/40 border-t-primary"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-10 rounded-full border border-accent/40 border-t-accent"
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-3xl font-bold text-gradient-brand">VTR</span>
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Diagnóstico em andamento</p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={msgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="font-display text-xl md:text-2xl font-semibold min-h-[2.5rem]"
            >
              {MESSAGES[msgIdx]}
            </motion.h2>
          </AnimatePresence>

          <div className="mt-8 h-1.5 rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full bg-gradient-brand"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
        </div>
      </main>
    </div>
  );
}
