import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitSchema = z.object({
  order_id: z.string().uuid(),
  transaction_id: z.string().trim().min(8).max(40).regex(/^[A-Za-z0-9_-]+$/, "Enter a valid UTR / transaction ID"),
  proof_url: z.string().url().max(1000),
});

export type CustomerNotification = {
  id: string;
  order_id: string | null;
  kind: "payment_submitted" | "payment_received" | "payment_rejected" | "order_accepted" | "order_update";
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export const submitManualPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth } = await context.supabase.auth.getUser();
    const email = auth.user?.email?.trim().toLowerCase();
    if (!email) throw new Error("Sign in to submit payment proof");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,customer_email,total")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order || order.customer_email.trim().toLowerCase() !== email) throw new Error("Order not found");

    const { data: payment, error: paymentReadError } = await supabaseAdmin
      .from("order_payments")
      .select("id,status,amount,verification_code")
      .eq("order_id", order.id)
      .eq("provider", "manual_phonepe")
      .maybeSingle();
    if (paymentReadError || !payment) throw new Error("QR payment record not found");
    if (payment.amount !== order.total) throw new Error("Payment amount mismatch. Contact YOMORA support.");
    if (payment.status === "completed") throw new Error("This payment is already verified");

    const { error } = await supabaseAdmin.from("order_payments").update({
      transaction_id: data.transaction_id.toUpperCase(),
      proof_url: data.proof_url,
      status: "proof_submitted",
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
    }).eq("id", payment.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("customer_notifications").insert({
      user_id: context.userId,
      order_id: order.id,
      kind: "payment_submitted",
      title: "Payment sent for verification",
      message: `We received transaction ${data.transaction_id.toUpperCase()} for payment code ${payment.verification_code}. YOMORA Admin will verify it shortly.`,
    });

    return { ok: true, verificationCode: payment.verification_code };
  });

const verifySchema = z.object({
  order_id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

export const verifyManualPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("id,customer_email,total").eq("id", data.order_id).maybeSingle();
    if (!order) throw new Error("Order not found");
    const { data: payment } = await supabaseAdmin.from("order_payments").select("id,status,amount,verification_code,transaction_id").eq("order_id", order.id).eq("provider", "manual_phonepe").maybeSingle();
    if (!payment) throw new Error("Payment record not found");
    if (payment.status !== "proof_submitted") throw new Error("Customer payment proof has not been submitted");
    if (payment.amount !== order.total || !payment.transaction_id) throw new Error("Payment details are incomplete or mismatched");

    const approved = data.decision === "approve";
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("order_payments").update({
      status: approved ? "completed" : "rejected",
      paid_at: approved ? now : null,
      verified_at: now,
      verified_by: context.userId,
      rejection_reason: approved ? null : (data.reason || "Payment could not be verified. Please review the transaction and submit again."),
    }).eq("id", payment.id);
    if (error) throw new Error(error.message);
    if (approved) await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order.id);

    let customerId: string | null = null;
    for (let page = 1; page <= 10 && !customerId; page += 1) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      customerId = users.users.find((user) => user.email?.trim().toLowerCase() === order.customer_email.trim().toLowerCase())?.id ?? null;
      if (users.users.length < 100) break;
    }
    if (customerId) {
      await supabaseAdmin.from("customer_notifications").insert({
        user_id: customerId,
        order_id: order.id,
        kind: approved ? "payment_received" : "payment_rejected",
        title: approved ? "Payment received — order accepted" : "Payment verification needs attention",
        message: approved
          ? `Payment ${payment.transaction_id} for code ${payment.verification_code} is verified. Your YOMORA order has been accepted.`
          : (data.reason || "We could not verify this payment. Please check the transaction details and submit proof again."),
      });
    }
    return { ok: true, status: approved ? "completed" : "rejected" };
  });

export const listMyNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("customer_notifications")
      .select("id,order_id,kind,title,message,read_at,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return (data ?? []) as CustomerNotification[];
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("customer_notifications").update({ read_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

