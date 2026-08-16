import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createValidation } from "@/lib/validate.functions";
import {
  uploadAttachment,
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/validar")({
  head: () => ({
    meta: [
      { title: "Validar Podcast — VTR Gestão IA" },
      { name: "description", content: "Descreva seu podcast e receba um diagnóstico estratégico executivo em menos de 15 segundos." },
      { property: "og:title", content: "Validar Podcast — VTR Gestão IA" },
      { property: "og:description", content: "Diagnóstico estratégico premium para sua ideia de podcast." },
      { property: "og:url", content: "/validar" },
    ],
    links: [{ rel: "canonical", href: "/validar" }],
  }),
  component: ValidarPage,
});

type AttachmentMeta = { name: string; path: string; size: number; type: string };

const MAX_CHARS = 700;
const ALLOWED = Object.keys(ALLOWED_ATTACHMENT_TYPES);

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function ValidarPage() {
  const navigate = useNavigate();
  const create = useServerFn(createValidation);
  const upload = useServerFn(uploadAttachment);

  const [desc, setDesc] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState<string>("");
  const [format, setFormat] = useState<string>("");
  const [files, setFiles] = useState<AttachmentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    if (files.length + fileList.length > 3) {
      toast.error("Máximo de 3 anexos.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Faça login para anexar arquivos.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const next: AttachmentMeta[] = [];
    try {
      for (const f of Array.from(fileList)) {
        if (f.size > MAX_ATTACHMENT_BYTES) {
          toast.error(`${f.name}: máximo 10MB.`);
          continue;
        }
        if (!ALLOWED.includes(f.type) && !f.name.match(/\.(pdf|txt|md|docx|pptx)$/i)) {
          toast.error(`${f.name}: formato não suportado.`);
          continue;
        }
        try {
          const meta = await upload({
            data: { fileName: f.name, contentType: f.type, dataBase64: await toBase64(f) },
          });
          next.push(meta);
        } catch {
          toast.error(`Falha ao enviar ${f.name}`);
        }
      }
      setFiles((prev) => [...prev, ...next]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (desc.trim().length < 20) {
      toast.error("Descreva seu podcast com mais detalhes (mínimo 20 caracteres).");
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await create({
        data: {
          description: desc.trim(),
          niche: niche.trim() || undefined,
          audience: audience.trim() || undefined,
          objective: objective || undefined,
          format: format || undefined,
          attachments: files,
        },
      });
      navigate({ to: "/processando/$id", params: { id } });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível iniciar a validação.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-hero">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/70 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo className="h-8" /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-widest text-primary/90 font-semibold mb-3">Diagnóstico estratégico</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Conte sobre o podcast que você quer validar.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Quanto mais contexto, mais preciso o diagnóstico. Leva menos de 15 segundos.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-7">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <Label htmlFor="desc" className="text-sm font-semibold">Descreva seu podcast *</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Ex: Podcast sobre carreira para profissionais de tecnologia com episódios curtos, convidados do mercado e foco em crescimento profissional."
              className="mt-3 min-h-[140px] resize-none bg-input/60 border-border/70 focus-visible:ring-primary"
              required
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 20 caracteres.</span>
              <span className={desc.length === MAX_CHARS ? "text-warning" : ""}>{desc.length} / {MAX_CHARS}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <Label htmlFor="niche" className="text-sm font-semibold">Nicho</Label>
              <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="negócios, tecnologia, lifestyle…" className="mt-2 bg-input/60" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Label htmlFor="audience" className="text-sm font-semibold">Público-alvo</Label>
              <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="empreendedores, devs, creators…" className="mt-2 bg-input/60" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Label className="text-sm font-semibold">Objetivo principal</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger className="mt-2 bg-input/60"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["audiência", "autoridade", "monetização", "comunidade", "vendas", "networking"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Label className="text-sm font-semibold">Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-2 bg-input/60"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["entrevista", "solo", "mesa redonda", "storytelling", "videocast"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-border border-dashed bg-card/60 p-6">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" /> Anexos opcionais
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Roteiro piloto, media kit, pitch comercial, identidade visual. PDF, DOCX, PPTX ou TXT. Máx 10MB cada, até 3 arquivos.
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.pptx"
              onChange={handleUpload}
              disabled={uploading || files.length >= 3}
              className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface-elevated file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-surface-elevated/80 disabled:opacity-50"
            />
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f) => (
                  <li key={f.path} className="flex items-center justify-between rounded-md bg-surface-elevated px-3 py-2 text-xs">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles((p) => p.filter((x) => x.path !== f.path))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting || desc.trim().length < 20}
              className="bg-success text-success-foreground hover:bg-success/90 h-12 px-7 text-sm font-semibold shadow-elevated flex-1"
            >
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Iniciando…</> : "Gerar diagnóstico estratégico"}
            </Button>
            <Link to="/" className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-6 h-12 text-sm font-medium hover:bg-surface-elevated">
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
