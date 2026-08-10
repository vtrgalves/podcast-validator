import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ThreadRow = {
  id: string;
  title: string;
  updated_at: string;
};

export type StoredSource = {
  documentId: string;
  title: string;
  page: number | null;
  pageEnd?: number | null;
  similarity: number;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: string; text?: string }>;
  metadata?: { sources?: StoredSource[] };
};


export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as ThreadRow[];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ title: z.string().trim().max(120).optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: data.title || "Nova conversa" })
      .select("id, title, updated_at")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Falha ao criar conversa");
    return row as ThreadRow;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, parts, sources, ai_message_id, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: (r.ai_message_id as string | null) ?? (r.id as string),
      role: r.role as StoredMessage["role"],
      parts: (r.parts ?? []) as StoredMessage["parts"],
      metadata: { sources: (r.sources ?? []) as StoredSource[] },
    })) as StoredMessage[];
  });


export const saveMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        role: z.enum(["user", "assistant"]),
        aiMessageId: z.string().max(120).optional(),
        parts: z.array(z.record(z.string(), z.unknown())).max(200),
        sources: z.array(z.record(z.string(), z.unknown())).max(50).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: data.role,
      parts: JSON.parse(JSON.stringify(data.parts)),
      sources: JSON.parse(JSON.stringify(data.sources ?? [])),
      ai_message_id: data.aiMessageId ?? null,
    });
    if (error) throw new Error(error.message);

    await context.supabase
      .from("threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.threadId);

    return { ok: true };
  });
