import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubscriptionPlan = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  duration_label: string;
  benefits: string[];
  cta_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export const getSubscriptionPlanFn = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("subscription_plan")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as SubscriptionPlan | null;
});

export const updateSubscriptionPlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    name: string;
    tagline: string;
    price: number;
    duration_label: string;
    benefits: string[];
    cta_label: string;
    is_active: boolean;
  }) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(120),
      tagline: z.string().max(300),
      price: z.number().int().min(0),
      duration_label: z.string().max(60),
      benefits: z.array(z.string().max(200)).max(20),
      cta_label: z.string().min(1).max(60),
      is_active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("subscription_plan")
      .update({
        name: data.name,
        tagline: data.tagline,
        price: data.price,
        duration_label: data.duration_label,
        benefits: data.benefits,
        cta_label: data.cta_label,
        is_active: data.is_active,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });