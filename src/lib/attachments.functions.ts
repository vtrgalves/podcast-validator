import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/** MIME permitidos -> extensões permitidas (validação dupla: tipo + extensão). */
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "text/plain": ["txt", "md"],
  "text/markdown": ["md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
};

const input = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.string().trim().max(160),
  dataBase64: z.string().min(1).max(Math.ceil(MAX_ATTACHMENT_BYTES * 1.4)),
});

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "arquivo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/** Confere assinatura binária (não confia apenas no MIME do navegador). */
function magicBytesOk(type: string, bytes: Uint8Array): boolean {
  if (type === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  }
  if (type.endsWith("wordprocessingml.document") || type.endsWith("presentationml.presentation")) {
    return bytes[0] === 0x50 && bytes[1] === 0x4b; // PK (zip)
  }
  return true; // text/plain e markdown não têm assinatura
}

/**
 * Upload seguro de anexo: exige login, valida tipo/extensão/tamanho/assinatura,
 * sanitiza o nome e grava sempre em {user_id}/{uuid}-{arquivo}.
 */
export const uploadAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const type = data.contentType.split(";")[0]!.trim().toLowerCase();
    const allowedExts = ALLOWED_ATTACHMENT_TYPES[type];
    if (!allowedExts) throw new Error("Formato de arquivo não permitido.");

    const safeName = sanitizeFileName(data.fileName);
    const ext = safeName.includes(".") ? safeName.split(".").pop()!.toLowerCase() : "";
    if (!allowedExts.includes(ext)) throw new Error("Extensão do arquivo não confere com o tipo.");

    const binary = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (binary.byteLength === 0) throw new Error("Arquivo vazio.");
    if (binary.byteLength > MAX_ATTACHMENT_BYTES) throw new Error("Arquivo acima de 10MB.");
    if (!magicBytesOk(type, binary)) throw new Error("Conteúdo do arquivo não corresponde ao formato.");

    const path = `${context.userId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await context.supabase.storage
      .from("attachments")
      .upload(path, binary, { contentType: type, upsert: false });
    if (error) throw new Error(error.message);

    return { name: safeName, path, size: binary.byteLength, type };
  });
