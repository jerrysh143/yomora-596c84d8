import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const paymentStatusInput = z.object({ order_id: z.string().uuid() });

export const getPaymentStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const [{ supabaseAdmin }, { getPhonePeOrderStatus, normalisePhonePeState }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/phonepe.server"),
    ]);
    const { data: authData } = await context.supabase.auth.getUser();
    const email = authData.user?.email?.trim().toLowerCase();
    if (!email) throw new Error("Sign in to check payment status");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,customer_email")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order || order.customer_email.trim().toLowerCase() !== email) {
      throw new Error("Payment not found");
    }

    const { data: payment, error } = await supabaseAdmin
      .from("order_payments")
      .select("merchant_order_id,amount,status")
      .eq("order_id", order.id)
      .maybeSingle();
    if (error || !payment) throw new Error("Payment not found");

    if (payment.status !== "pending") return { status: payment.status, orderId: order.id };

    const response = await getPhonePeOrderStatus(payment.merchant_order_id);
    let status = normalisePhonePeState(response.state);
    if (status === "completed" && response.amount !== payment.amount * 100) status = "failed";
    const transaction = response.paymentDetails?.find((detail) => detail.state === "COMPLETED") ?? response.paymentDetails?.[0];
    await supabaseAdmin.from("order_payments").update({
      status,
      provider_order_id: response.orderId,
      transaction_id: transaction?.transactionId ?? null,
      payment_mode: transaction?.paymentMode ?? null,
      error_code: response.errorCode ?? transaction?.errorCode ?? (status === "failed" ? "AMOUNT_MISMATCH" : null),
      provider_response: JSON.parse(JSON.stringify(response)),
      paid_at: status === "completed" ? new Date().toISOString() : null,
    }).eq("order_id", order.id);

    return { status, orderId: order.id };
  });
