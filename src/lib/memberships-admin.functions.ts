import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminMembership = {
  id: string;
  user_id: string;
  user_email: string | null;
  plan_id: string | null;
  plan_name: string | null;
  status: "pending" | "active" | "expired" | "cancelled";
  activated_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  member_number: string | null;
  notes: string | null;
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

export const listMembershipsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("memberships")
      .select("*, plan:subscription_plan(id,name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emails = new Map<string, string>();
    const ids = Array.from(new Set((data ?? []).map((m: any) => m.user_id)));
    await Promise.all(
      ids.map(async (id) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        if (u?.user?.email) emails.set(id, u.user.email);
      }),
    );

    return (data ?? []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      user_email: emails.get(m.user_id) ?? null,
      plan_id: m.plan_id,
      plan_name: m.plan?.name ?? null,
      status: m.status,
      activated_at: m.activated_at,
      expires_at: m.expires_at,
      auto_renew: m.auto_renew,
      member_number: m.member_number,
      notes: m.notes,
      created_at: m.created_at,
      updated_at: m.updated_at,
    })) as AdminMembership[];
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid().nullable(),
  status: z.enum(["pending", "active", "expired", "cancelled"]),
  activated_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  auto_renew: z.boolean(),
  member_number: z.string().max(60).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const updateMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof updateSchema>) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("memberships")
      .update(rest)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("memberships")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const createSchema = z.object({
  user_email: z.string().email(),
  plan_id: z.string().uuid().nullable(),
  status: z.enum(["pending", "active", "expired", "cancelled"]),
  activated_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  auto_renew: z.boolean(),
  member_number: z.string().max(60).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const createMembershipFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof createSchema>) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Find user by email via listUsers (paginated). For simplicity: query auth via admin.
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    const user = list.users.find(
      (u) => u.email?.toLowerCase() === data.user_email.toLowerCase(),
    );
    if (!user) throw new Error(`No user found with email ${data.user_email}`);

    const { user_email: _e, ...rest } = data;
    const { error } = await context.supabase.from("memberships").insert({
      user_id: user.id,
      ...rest,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });