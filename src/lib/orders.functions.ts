import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = "pending" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const checkoutInput = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().min(6).max(30).regex(/^[0-9+()\-\s]+$/, "Invalid phone"),
  shipping_address: z.string().trim().min(10).max(600),
  payment_method: z.enum(["upi", "card", "netbank", "cod"]),
  items: z
    .array(z.object({ id: z.string().min(1).max(80), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

function getClientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function requestFingerprint(request: Request, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(getClientAddress(request)),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Creates a real order server-side. Product names and prices are always read from the database. */
export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkoutInput.parse(d))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { getRequest }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!request || !serviceRoleKey) throw new Error("Checkout is temporarily unavailable");

    const fingerprint = await requestFingerprint(request, serviceRoleKey);
    const { count, error: rateError } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .like("notes", `%[request:${fingerprint}]%`)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
    if (rateError) throw new Error(rateError.message);
    if ((count ?? 0) >= 3) throw new Error("Too many order requests. Please try again in a few minutes.");

    const requestedIds = [...new Set(data.items.map((item) => item.id))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id,name,price,sold_out")
      .in("id", requestedIds);
    if (productError) throw new Error(productError.message);

    const byId = new Map((products ?? []).map((product) => [product.id, product]));
    const items: OrderItem[] = data.items.map((item) => {
      const product = byId.get(item.id);
      if (!product || product.sold_out) throw new Error("One or more selected products are unavailable");
      return { id: product.id, name: product.name, price: product.price, quantity: item.quantity };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Keep this server-side so the browser cannot alter the payable amount.
    const discount = subtotal >= 1500 ? 210 : 0;
    const total = subtotal - discount;
    const notes = `Payment method: ${data.payment_method}\n[request:${fingerprint}]`;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email.toLowerCase(),
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        items,
        total,
        notes,
        status: "pending",
      })
      .select("id,total")
      .single();
    if (error) throw new Error(error.message);
    return { id: order.id, total: order.total };
  });

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(ctx: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export const listOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Order[];
  });

export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: OrderStatus }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "completed", "cancelled"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
