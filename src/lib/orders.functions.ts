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

export type InvoiceDetails = {
  invoice_number?: string;
  tax_rate?: number;
  discount?: number;
  seller_name?: string;
  seller_address?: string;
  seller_phone?: string;
  bank_details?: string;
  thank_you_note?: string;
  notes?: string;
};

const INVOICE_MARKER = "\n\n---YOMORA-INVOICE---\n";

function invoiceDetailsFromNotes(notes: string | null | undefined): InvoiceDetails {
  const markerAt = notes?.lastIndexOf(INVOICE_MARKER) ?? -1;
  if (markerAt < 0) return {};
  try {
    const parsed = JSON.parse(notes!.slice(markerAt + INVOICE_MARKER.length));
    return parsed && typeof parsed === "object" ? parsed as InvoiceDetails : {};
  } catch {
    return {};
  }
}

function notesWithoutInvoiceDetails(notes: string | null | undefined) {
  const markerAt = notes?.lastIndexOf(INVOICE_MARKER) ?? -1;
  return markerAt < 0 ? (notes ?? "") : notes!.slice(0, markerAt).trimEnd();
}

function mapOrder(row: any): Order {
  return { ...row, invoice_details: invoiceDetailsFromNotes(row.notes) } as Order;
}

const checkoutInput = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().min(6).max(30).regex(/^[0-9+()\-\s]+$/, "Invalid phone"),
  shipping_address: z.string().trim().min(10).max(600),
  payment_method: z.enum(["upi", "card", "netbank", "cod"]),
  coupon_code: z.string().trim().max(40).optional(),
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
    const total = subtotal;
    const notes = `Payment method: ${data.payment_method}\n[request:${fingerprint}]`;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email.toLowerCase(),
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        items,
        subtotal,
        discount_amount: 0,
        total,
        notes,
        status: "pending",
      })
      .select("id,total")
      .single();
    if (error) throw new Error(error.message);

    if (data.coupon_code) {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const { data: auth } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null } };
      if (auth.user?.email && auth.user.email.toLowerCase() !== data.customer_email.toLowerCase()) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        throw new Error("Use the email address connected to your signed-in account");
      }
      const { data: redeemed, error: couponError } = await supabaseAdmin.rpc("redeem_coupon_for_order", {
        _order_id: order.id,
        _coupon_code: data.coupon_code,
        _user_id: auth.user?.id ?? null,
      });
      if (couponError || !redeemed?.[0]) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        const message = couponError?.message?.replace(/^.*?: /, "") || "Unable to apply coupon";
        throw new Error(message);
      }
      return {
        id: order.id,
        total: redeemed[0].total,
        discount: redeemed[0].discount_amount,
        couponCode: redeemed[0].coupon_code,
      };
    }

    return { id: order.id, total: order.total, discount: 0, couponCode: null };
  });

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  coupon_code: string | null;
  total: number;
  status: OrderStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  invoice_details?: InvoiceDetails;
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
    return (data ?? []).map(mapOrder);
  });

/** Returns only the orders belonging to the currently signed-in customer's email. */
export const listMyOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: auth, error: authError } = await context.supabase.auth.getUser();
    const email = auth.user?.email?.trim().toLowerCase();
    if (authError || !email) throw new Error("Unable to identify your account");

    // Orders were created before customer accounts existed, so they are safely matched
    // on the authenticated email server-side rather than exposing the orders table.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id,customer_name,customer_email,customer_phone,shipping_address,items,subtotal,discount_amount,coupon_code,total,status,notes,created_at,updated_at")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapOrder);
  });

const invoiceDetailsSchema = z.object({
  invoice_number: z.string().trim().max(80).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  discount: z.number().int().min(0).max(10_000_000).optional(),
  seller_name: z.string().trim().max(160).optional(),
  seller_address: z.string().trim().max(1000).optional(),
  seller_phone: z.string().trim().max(80).optional(),
  bank_details: z.string().trim().max(1000).optional(),
  thank_you_note: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateInvoiceDetailsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; invoice_details: InvoiceDetails }) =>
    z.object({ id: z.string().uuid(), invoice_details: invoiceDetailsSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: order, error: readError } = await context.supabase
      .from("orders")
      .select("notes")
      .eq("id", data.id)
      .single();
    if (readError) throw new Error(readError.message);
    const notes = `${notesWithoutInvoiceDetails(order.notes)}${INVOICE_MARKER}${JSON.stringify(data.invoice_details)}`;
    const { error } = await context.supabase
      .from("orders")
      .update({ notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Returns one invoice only to its customer or an administrator. */
export const getInvoiceOrderFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: auth, error: authError }, { data: isAdmin }] = await Promise.all([
      context.supabase.auth.getUser(),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    const email = auth.user?.email?.trim().toLowerCase();
    if (authError || (!email && !isAdmin)) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("orders").select("*").eq("id", data.id);
    if (!isAdmin) query = query.eq("customer_email", email!);
    const { data: order, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Invoice not found");
    return mapOrder(order);
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
