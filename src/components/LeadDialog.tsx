import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLead } from "@/lib/lead.functions";

export function LeadDialog({ validationId, trigger }: { validationId: string; trigger: React.ReactNode }) {
  const create = useServerFn(createLead);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || !email.includes("@")) {
      toast.error("Preencha nome e email válidos.");
      return;
    }
    setLoading(true);
    try {
      await create({ data: { validationId, name: name.trim(), email: email.trim(), whatsapp: whatsapp.trim() || null, message: message.trim() || null } });
      toast.success("Recebemos seu contato. Em breve falaremos com você.");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Falar com a VTR Gestão</DialogTitle>
          <DialogDescription>
            Vamos transformar este diagnóstico em estratégia, monetização e execução para o seu podcast.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="ln">Nome *</Label>
            <Input id="ln" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 bg-input/60" required />
          </div>
          <div>
            <Label htmlFor="le">Email *</Label>
            <Input id="le" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-input/60" required />
          </div>
          <div>
            <Label htmlFor="lw">WhatsApp</Label>
            <Input id="lw" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1.5 bg-input/60" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label htmlFor="lm">Mensagem</Label>
            <Textarea id="lm" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5 bg-input/60 min-h-[80px]" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-success text-success-foreground hover:bg-success/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar contato"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
