import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Membership = {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: "pending" | "active" | "expired" | "cancelled";
  activated_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  member_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  plan?: {
    id: string;
    name: string;
    tagline: string;
    price: number;
    duration_label: string;
    benefits: string[];
  } | null;
};

export const getMyMembershipFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("memberships")
      .select(
        "*, plan:subscription_plan(id,name,tagline,price,duration_label,benefits)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as Membership | null;
  });

export const requestMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("memberships")
      .select("id,status")
      .eq("user_id", context.userId)
      .in("status", ["pending", "active"])
      .maybeSingle();
    if (existing) return { ok: true, id: existing.id, already: true };

    const { data: plan } = await context.supabase
      .from("subscription_plan")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data, error } = await context.supabase
      .from("memberships")
      .insert({
        user_id: context.userId,
        plan_id: plan?.id ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data.id, already: false };
  });