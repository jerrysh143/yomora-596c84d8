import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const notifyInput = z
  .object({
    product_id: z.string().min(1).max(80),
    name: z.string().max(120).default(""),
    email: z.string().max(200).email().or(z.literal("")).default(""),
    phone: z.string().max(30).default(""),
  })
  .refine((v) => v.email !== "" || v.phone !== "", "Enter an email or phone number");

export const createNotifyRequestFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => notifyInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { error } = await sb.from("product_notify_requests").insert({
      product_id: data.product_id,
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listNotifyRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");
    const { data, error } = await context.supabase
      .from("product_notify_requests")
      .select("id,product_id,name,email,phone,notified,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
