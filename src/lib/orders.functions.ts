import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = "pending" | "completed" | "cancelled";
export const COMPLIMENTARY_MEMBERSHIP_THRESHOLD = 25_000;

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
  address_line: z.string().trim().min(5).max(400),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  payment_method: z.enum(["upi", "card", "netbank", "cod"]),
  coupon_code: z.string().trim().max(40).optional(),
  items: z
    .array(z.object({ id: z.string().min(1).max(80), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

const trackOrderInput = z.object({
  order_id: z.string().trim().uuid("Enter the complete order ID"),
  customer_email: z.string().trim().email().max(200),
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const [{ supabaseAdmin }, { getRequest }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!request || !serviceRoleKey) throw new Error("Checkout is temporarily unavailable");

    const { data: authData, error: authError } = await context.supabase.auth.getUser();
    const accountEmail = authData.user?.email?.trim().toLowerCase();
    if (authError || !accountEmail) throw new Error("Sign in before placing an order");
    if (accountEmail !== data.customer_email.trim().toLowerCase()) {
      throw new Error("Use the email address connected to your YOMORA account");
    }

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

    // Shipping data is isolated from the order. A Velocity outage must never roll
    // back a valid checkout or alter existing customer/order records.
    await supabaseAdmin.from("order_shipments").insert({
      order_id: order.id,
      payment_method: data.payment_method === "cod" ? "COD" : "PREPAID",
      address_line: data.address_line,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      status: "pending_sync",
    });

    let payableTotal = order.total;
    let discount = 0;
    let couponCode: string | null = null;

    if (data.coupon_code) {
      const { data: redeemed, error: couponError } = await supabaseAdmin.rpc("redeem_coupon_for_order", {
        _order_id: order.id,
        _coupon_code: data.coupon_code,
        _user_id: authData.user.id,
      });
      if (couponError || !redeemed?.[0]) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        const message = couponError?.message?.replace(/^.*?: /, "") || "Unable to apply coupon";
        throw new Error(message);
      }
      payableTotal = redeemed[0].total;
      discount = redeemed[0].discount_amount;
      couponCode = redeemed[0].coupon_code;
    }

    if (data.payment_method === "cod") {
      return { id: order.id, total: payableTotal, discount, couponCode, paymentUrl: null };
    }

    const merchantOrderId = `YOMORA_${order.id.replaceAll("-", "")}`;
    const verificationCode = `YP-${order.id.slice(0, 4).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const { error: paymentError } = await supabaseAdmin.from("order_payments").insert({
      order_id: order.id,
      provider: "manual_phonepe",
      merchant_order_id: merchantOrderId,
      amount: payableTotal,
      status: "pending",
      payment_mode: "UPI_QR",
      verification_code: verificationCode,
    });
    if (paymentError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Unable to prepare QR payment. Please try again.");
    }
    return { id: order.id, total: payableTotal, discount, couponCode, paymentUrl: null, verificationCode };
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
  payment_status?: "pending" | "proof_submitted" | "completed" | "failed" | "cancelled" | "rejected" | null;
  payment_mode?: string | null;
  payment_transaction_id?: string | null;
  payment_verification_code?: string | null;
  payment_proof_url?: string | null;
  payment_rejection_reason?: string | null;
  invoice_details?: InvoiceDetails;
};

/** Public order tracking only returns delivery-safe fields after matching order ID and email. */
export const trackOrderFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => trackOrderInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,status,created_at,updated_at")
      .eq("id", data.order_id)
      .eq("customer_email", data.customer_email.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("No order matches that order ID and email address");
    return order;
  });

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderIds = (data ?? []).map((order) => order.id);
    const { data: payments } = orderIds.length
      ? await supabaseAdmin.from("order_payments").select("order_id,status,payment_mode,transaction_id,verification_code,proof_url,rejection_reason").in("order_id", orderIds)
      : { data: [] };
    const byOrder = new Map((payments ?? []).map((payment) => [payment.order_id, payment]));
    return (data ?? []).map((row) => {
      const payment = byOrder.get(row.id);
      return {
        ...mapOrder(row),
        payment_status: (payment?.status ?? null) as Order["payment_status"],
        payment_mode: payment?.payment_mode ?? null,
        payment_transaction_id: payment?.transaction_id ?? null,
        payment_verification_code: payment?.verification_code ?? null,
        payment_proof_url: payment?.proof_url ?? null,
        payment_rejection_reason: payment?.rejection_reason ?? null,
      };
    });
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
    const orderIds = (data ?? []).map((order) => order.id);
    const { data: payments } = orderIds.length
      ? await supabaseAdmin.from("order_payments").select("order_id,status,payment_mode,transaction_id,verification_code,proof_url,rejection_reason").in("order_id", orderIds)
      : { data: [] };
    const byOrder = new Map((payments ?? []).map((payment) => [payment.order_id, payment]));
    return (data ?? []).map((row) => {
      const payment = byOrder.get(row.id);
      return {
        ...mapOrder(row),
        payment_status: (payment?.status ?? null) as Order["payment_status"],
        payment_mode: payment?.payment_mode ?? null,
        payment_transaction_id: payment?.transaction_id ?? null,
        payment_verification_code: payment?.verification_code ?? null,
        payment_proof_url: payment?.proof_url ?? null,
        payment_rejection_reason: payment?.rejection_reason ?? null,
      };
    });
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
    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("id,customer_email,total")
      .single();
    if (orderError) throw new Error(orderError.message);

    let membershipActivated = false;
    if (data.status === "completed" && order.total >= COMPLIMENTARY_MEMBERSHIP_THRESHOLD) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let customerId: string | null = null;
      for (let page = 1; page <= 10 && !customerId; page += 1) {
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
        if (usersError) throw new Error(usersError.message);
        customerId = users.users.find((user) => user.email?.trim().toLowerCase() === order.customer_email.trim().toLowerCase())?.id ?? null;
        if (users.users.length < 100) break;
      }

      if (customerId) {
        const [{ data: plan }, { data: existing }] = await Promise.all([
          supabaseAdmin.from("subscription_plan").select("id").eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle(),
          supabaseAdmin.from("memberships").select("id,status").eq("user_id", customerId).in("status", ["pending", "active"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (!existing || existing.status !== "active") {
          const activatedAt = new Date();
          const expiresAt = new Date(activatedAt);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          const membershipValues = {
            plan_id: plan?.id ?? null,
            status: "active" as const,
            activated_at: activatedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            member_number: `YOM-${customerId.slice(0, 6).toUpperCase()}-${order.id.slice(0, 6).toUpperCase()}`,
            notes: `Complimentary membership earned with order ${order.id}`,
          };
          const result = existing
            ? await supabaseAdmin.from("memberships").update(membershipValues).eq("id", existing.id)
            : await supabaseAdmin.from("memberships").insert({ ...membershipValues, user_id: customerId });
          if (result.error) throw new Error(result.error.message);
          membershipActivated = true;
        }
      }
    }
    return { ok: true, membershipActivated };
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
