import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  validationId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

export const createLead = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads").insert({
      validation_id: data.validationId ?? null,
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp ?? null,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
