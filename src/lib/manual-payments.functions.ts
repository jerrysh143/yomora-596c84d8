import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { formatOrderNumber } from "@/lib/order-reference";

const submitSchema = z.object({
  order_id: z.string().uuid(),
  transaction_id: z
    .string()
    .trim()
    .min(8)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Enter a valid UTR / transaction ID"),
  proof_url: z.string().url().max(1000),
});

function normalizeTransactionId(value: string) {
  return value.trim().toUpperCase();
}

function isValidTransactionId(value: string) {
  return /^[A-Z0-9_-]{8,40}$/.test(value) && /\d{4}/.test(value);
}

async function assertTransactionIdAvailable(
  supabaseAdmin: SupabaseClient<Database>,
  transactionId: string,
  paymentId: string,
) {
  const { data: duplicate, error } = await supabaseAdmin
    .from("order_payments")
    .select("id")
    .eq("provider", "manual_phonepe")
    .eq("transaction_id", transactionId)
    .neq("id", paymentId)
    .neq("status", "rejected")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (duplicate)
    throw new Error("This UTR / transaction ID was already submitted for another order");
}

export type CustomerNotification = {
  id: string;
  order_id: string | null;
  kind:
    | "payment_submitted"
    | "payment_received"
    | "payment_rejected"
    | "order_accepted"
    | "order_update";
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

async function findCustomerIdByEmail(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    const customerId = users.users.find(
      (user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase(),
    )?.id;
    if (customerId) return customerId;
    if (users.users.length < 100) break;
  }
  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendPaymentVerificationReminderEmail(input: {
  customerName: string;
  customerEmail: string;
  orderReference: string;
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

  const { default: nodemailer } = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === "true"
    : port === 465;
  const from = process.env.SMTP_FROM || `YOMORA <${user}>`;
  const accountUrl = `${process.env.PUBLIC_SITE_URL || "https://yomora.in"}/account?section=orders`;
  const safeName = escapeHtml(input.customerName);
  const safeReference = escapeHtml(input.orderReference);

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  await transporter.sendMail({
    from,
    to: input.customerEmail,
    replyTo: "hello@yomora.in",
    subject: `Complete payment verification for YOMORA order #${input.orderReference}`,
    text: `Hello ${input.customerName},\n\nPayment verification for your YOMORA order #${input.orderReference} is not completed yet. Please open My Orders, upload a clear payment screenshot and enter the correct UTR number.\n\nComplete verification: ${accountUrl}\n\nWe will confirm your order after the payment is verified.\n\nYOMORA by Nehalbhai Devika Jewellers`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f0e7;color:#17130f;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="background:#0d0b09;color:#d1a45f;padding:22px;text-align:center;letter-spacing:5px;font-size:20px">YOMORA</div><div style="background:#fffaf2;border:1px solid #dbcbb5;padding:30px"><p style="margin-top:0">Hello ${safeName},</p><h1 style="font-family:Georgia,serif;font-size:27px;font-weight:400">Complete payment verification</h1><p>Payment verification for order <strong>#${safeReference}</strong> is not completed yet.</p><p>Please open My Orders, upload a clear payment screenshot and enter the correct UTR number.</p><p style="margin:28px 0"><a href="${accountUrl}" style="display:inline-block;background:#0d0b09;color:#d1a45f;padding:14px 20px;text-decoration:none;font-weight:700;letter-spacing:1px">COMPLETE VERIFICATION</a></p><p style="color:#6f6255;font-size:13px">We will confirm your order after the payment is verified.</p></div><div style="padding:18px;text-align:center;color:#6f6255;font-size:12px">YOMORA by Nehalbhai Devika Jewellers · hello@yomora.in</div></div></body></html>`,
  });
  return true;
}

const paymentReminderSchema = z.object({ order_id: z.string().uuid() });

export const sendPaymentVerificationReminderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentReminderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Administrator access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,customer_name,customer_email,status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.status === "cancelled") throw new Error("Cancelled orders cannot receive reminders");

    const { data: payment } = await supabaseAdmin
      .from("order_payments")
      .select("status,payment_mode")
      .eq("order_id", order.id)
      .eq("provider", "manual_phonepe")
      .maybeSingle();
    if (!payment || payment.payment_mode !== "UPI_QR")
      throw new Error("This order does not use QR payment verification");
    if (payment.status === "completed") throw new Error("Payment is already verified");

    const orderReference = formatOrderNumber(order.id);
    const customerId = await findCustomerIdByEmail(supabaseAdmin, order.customer_email);
    let notificationSent = false;
    if (customerId) {
      const { error } = await supabaseAdmin.from("customer_notifications").insert({
        user_id: customerId,
        order_id: order.id,
        kind: "order_update",
        title: "Complete your payment verification",
        message: `Payment verification for order #${orderReference} is not completed. Upload a clear payment screenshot and enter the correct UTR number in My Orders.`,
      });
      if (error) throw new Error(error.message);
      notificationSent = true;
    }

    let emailSent = false;
    try {
      emailSent = await sendPaymentVerificationReminderEmail({
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        orderReference,
      });
    } catch (error) {
      console.error("Payment verification reminder email failed", error);
    }

    return { ok: true, notificationSent, emailSent };
  });

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
    if (!order || order.customer_email.trim().toLowerCase() !== email)
      throw new Error("Order not found");

    const { data: payment, error: paymentReadError } = await supabaseAdmin
      .from("order_payments")
      .select("id,status,amount,verification_code")
      .eq("order_id", order.id)
      .eq("provider", "manual_phonepe")
      .maybeSingle();
    if (paymentReadError || !payment) throw new Error("QR payment record not found");
    if (payment.amount !== order.total)
      throw new Error("Payment amount mismatch. Contact YOMORA support.");
    if (payment.status === "completed") throw new Error("This payment is already verified");

    const transactionId = normalizeTransactionId(data.transaction_id);
    if (!isValidTransactionId(transactionId)) throw new Error("Enter a valid UTR / transaction ID");
    await assertTransactionIdAvailable(supabaseAdmin, transactionId, payment.id);

    const { error } = await supabaseAdmin
      .from("order_payments")
      .update({
        transaction_id: transactionId,
        proof_url: data.proof_url,
        status: "proof_submitted",
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", payment.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("customer_notifications").insert({
      user_id: context.userId,
      order_id: order.id,
      kind: "payment_submitted",
      title: "Payment sent for verification",
      message: `We received transaction ${transactionId} for payment code ${payment.verification_code}. YOMORA Admin will verify it shortly.`,
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
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,customer_email,total")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    const { data: payment } = await supabaseAdmin
      .from("order_payments")
      .select("id,status,amount,verification_code,transaction_id,proof_url")
      .eq("order_id", order.id)
      .eq("provider", "manual_phonepe")
      .maybeSingle();
    if (!payment) throw new Error("Payment record not found");
    if (payment.status !== "proof_submitted")
      throw new Error("Customer payment proof has not been submitted");
    if (payment.amount !== order.total || !payment.transaction_id || !payment.proof_url)
      throw new Error("Payment details are incomplete or mismatched");
    const transactionId = normalizeTransactionId(payment.transaction_id);
    if (!isValidTransactionId(transactionId))
      throw new Error("The submitted UTR format is invalid");
    await assertTransactionIdAvailable(supabaseAdmin, transactionId, payment.id);

    const approved = data.decision === "approve";
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("order_payments")
      .update({
        status: approved ? "completed" : "rejected",
        paid_at: approved ? now : null,
        verified_at: now,
        verified_by: context.userId,
        rejection_reason: approved
          ? null
          : data.reason ||
            "Payment could not be verified. Please review the transaction and submit again.",
      })
      .eq("id", payment.id);
    if (error) throw new Error(error.message);
    if (approved)
      await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order.id);

    let customerId: string | null = null;
    for (let page = 1; page <= 10 && !customerId; page += 1) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      customerId =
        users.users.find(
          (user) => user.email?.trim().toLowerCase() === order.customer_email.trim().toLowerCase(),
        )?.id ?? null;
      if (users.users.length < 100) break;
    }
    if (customerId) {
      await supabaseAdmin.from("customer_notifications").insert({
        user_id: customerId,
        order_id: order.id,
        kind: approved ? "payment_received" : "payment_rejected",
        title: approved
          ? "Payment received — order accepted"
          : "Payment verification needs attention",
        message: approved
          ? `Payment ${payment.transaction_id} for code ${payment.verification_code} is verified. Your YOMORA order has been accepted.`
          : data.reason ||
            "We could not verify this payment. Please check the transaction details and submit proof again.",
      });
    }
    return { ok: true, status: approved ? "completed" : "rejected" };
  });

export const listMyNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("customer_notifications")
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
    const { error } = await supabaseAdmin
      .from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
