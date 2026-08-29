import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/phonepe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const authorization = request.headers.get("authorization") ?? "";
        try {
          const [{ validatePhonePeCallback, normalisePhonePeState }, { supabaseAdmin }] = await Promise.all([
            import("@/lib/phonepe.server"),
            import("@/integrations/supabase/client.server"),
          ]);
          const callback = validatePhonePeCallback(authorization, body);
          const merchantOrderId = callback.payload.merchantOrderId;
          if (!merchantOrderId) return Response.json({ message: "Missing merchant order ID" }, { status: 400 });

          const { data: payment } = await supabaseAdmin
            .from("order_payments")
            .select("amount,status")
            .eq("merchant_order_id", merchantOrderId)
            .maybeSingle();
          if (!payment) return Response.json({ ok: true });
          if (payment.status === "completed") return Response.json({ ok: true, duplicate: true });

          let status = normalisePhonePeState(callback.payload.state);
          if (status === "completed" && callback.payload.amount !== payment.amount * 100) status = "failed";
          const transaction = callback.payload.paymentDetails?.find((detail) => detail.state === "COMPLETED") ?? callback.payload.paymentDetails?.[0];
          const rawPayload = JSON.parse(body);
          const { error } = await supabaseAdmin.from("order_payments").update({
            status,
            provider_order_id: callback.payload.orderId,
            transaction_id: transaction?.transactionId ?? null,
            payment_mode: transaction?.paymentMode ?? null,
            error_code: callback.payload.errorCode ?? transaction?.errorCode ?? (status === "failed" ? "AMOUNT_MISMATCH" : null),
            provider_response: rawPayload,
            paid_at: status === "completed" ? new Date().toISOString() : null,
          }).eq("merchant_order_id", merchantOrderId);
          if (error) return Response.json({ message: "Unable to record payment" }, { status: 500 });
          return Response.json({ ok: true });
        } catch (error) {
          console.error("Rejected PhonePe webhook", error);
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }
      },
    },
  },
});
