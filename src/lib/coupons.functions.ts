import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DiscountType = "percentage" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  member_only: boolean;
  usage_limit: number | null;
  per_customer_limit: number;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const couponFields = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, - or _"),
  description: z.string().trim().max(300),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().int().positive().max(10_000_000),
  minimum_order: z.number().int().min(0).max(10_000_000),
  maximum_discount: z.number().int().positive().max(10_000_000).nullable(),
  member_only: z.boolean(),
  usage_limit: z.number().int().positive().max(1_000_000).nullable(),
  per_customer_limit: z.number().int().positive().max(100),
  starts_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime().nullable(),
  is_active: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.discount_type === "percentage" && value.discount_value > 100) {
    ctx.addIssue({ code: "custom", path: ["discount_value"], message: "Percentage cannot exceed 100" });
  }
  if (value.starts_at && value.expires_at && value.starts_at >= value.expires_at) {
    ctx.addIssue({ code: "custom", path: ["expires_at"], message: "End date must be after start date" });
  }
});

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export const listCouponsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Coupon[];
  });

export const createCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => couponFields.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: coupon, error } = await context.supabase
      .from("coupons")
      .insert({ ...data, code: data.code.toUpperCase() })
      .select("*")
      .single();
    if (error) throw new Error(error.code === "23505" ? "That coupon code already exists" : error.message);
    return coupon as Coupon;
  });

export const updateCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), coupon: couponFields }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: coupon, error } = await context.supabase
      .from("coupons")
      .update({ ...data.coupon, code: data.coupon.code.toUpperCase() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.code === "23505" ? "That coupon code already exists" : error.message);
    return coupon as Coupon;
  });

export const deleteCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) {
      throw new Error(error.code === "23503" ? "Used coupons cannot be deleted. Make this coupon inactive instead." : error.message);
    }
    return { ok: true };
  });

const validateInput = z.object({
  code: z.string().trim().min(1).max(40),
  items: z.array(z.object({ id: z.string().min(1).max(80), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
  customer_email: z.string().trim().email().optional(),
});

async function optionalAuthenticatedUser() {
  const [{ getRequest }, { supabaseAdmin }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("@/integrations/supabase/client.server"),
  ]);
  const request = getRequest();
  const authHeader = request?.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

/** Provides a checkout preview. Final validation is repeated atomically when the order is created. */
export const validateCouponFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => validateInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const requestedIds = [...new Set(data.items.map((item) => item.id))];
    const [{ data: products, error: productsError }, { data: coupon, error: couponError }, user] = await Promise.all([
      supabaseAdmin.from("products").select("id,price,sold_out").in("id", requestedIds),
      supabaseAdmin.from("coupons").select("*").eq("code", data.code.trim().toUpperCase()).maybeSingle(),
      optionalAuthenticatedUser(),
    ]);
    if (productsError) throw new Error(productsError.message);
    if (couponError) throw new Error(couponError.message);
    if (!coupon) throw new Error("Invalid coupon code");

    const now = Date.now();
    if (!coupon.is_active) throw new Error("This coupon is inactive");
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) throw new Error("This coupon is not active yet");
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) throw new Error("This coupon has expired");
    if (coupon.usage_limit != null && coupon.times_used >= coupon.usage_limit) throw new Error("This coupon has reached its usage limit");

    const byId = new Map((products ?? []).map((product) => [product.id, product]));
    const subtotal = data.items.reduce((sum, item) => {
      const product = byId.get(item.id);
      if (!product || product.sold_out) throw new Error("One or more selected products are unavailable");
      return sum + product.price * item.quantity;
    }, 0);
    if (subtotal < coupon.minimum_order) {
      throw new Error(`Minimum order amount for this coupon is ₹${coupon.minimum_order.toLocaleString("en-IN")}`);
    }

    if (coupon.member_only) {
      if (!user) throw new Error("Sign in to use this membership coupon");
      const { data: memberships, error } = await supabaseAdmin
        .from("memberships")
        .select("id,expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(20);
      if (error) throw new Error(error.message);
      const activeMembership = memberships?.some((membership) =>
        !membership.expires_at || new Date(membership.expires_at).getTime() >= now,
      );
      if (!activeMembership) throw new Error("An active membership is required for this coupon");
      if (data.customer_email && user.email?.toLowerCase() !== data.customer_email.toLowerCase()) {
        throw new Error("Use the email address connected to your membership");
      }
    }

    const redemptionEmail = data.customer_email?.toLowerCase() || user?.email?.toLowerCase();
    if (user || redemptionEmail) {
      let redemptionsQuery = supabaseAdmin
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);
      redemptionsQuery = user
        ? redemptionsQuery.eq("user_id", user.id)
        : redemptionsQuery.eq("customer_email", redemptionEmail!);
      const { count, error } = await redemptionsQuery;
      if (error) throw new Error(error.message);
      if ((count ?? 0) >= coupon.per_customer_limit) throw new Error("You have already used this coupon");
    }

    let discount = coupon.discount_type === "percentage"
      ? Math.floor(subtotal * coupon.discount_value / 100)
      : coupon.discount_value;
    if (coupon.discount_type === "percentage" && coupon.maximum_discount != null) {
      discount = Math.min(discount, coupon.maximum_discount);
    }
    discount = Math.min(discount, subtotal);
    return {
      code: coupon.code.toUpperCase(),
      description: coupon.description,
      memberOnly: coupon.member_only,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  });
