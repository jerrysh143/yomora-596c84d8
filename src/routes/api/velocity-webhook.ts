import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  event_id: z.string().min(8).max(200),
  event_timestamp: z.string().optional(),
  data: z.object({
    shipment_id: z.string().min(1).max(100),
    tracking_number: z.string().min(1).max(100).optional(),
    order_external_id: z.string().max(200).optional(),
    status: z.string().min(1).max(100),
    sub_status: z.string().max(100).optional(),
    carrier_name: z.string().max(200).optional(),
    estimated_delivery_date: z.string().nullable().optional(),
    delivered_at: z.string().nullable().optional(),
    tracking_url: z.string().url().nullable().optional(),
  }),
});

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return mismatch === 0;
}

export const Route = createFileRoute("/api/velocity-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const configuredKey = process.env.VELOCITY_WEBHOOK_API_KEY?.trim();
        const suppliedKey = request.headers.get("x-api-key")?.trim() || "";
        if (!configuredKey || !suppliedKey || !constantTimeEqual(configuredKey, suppliedKey)) {
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }

        const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return Response.json({ message: "Invalid webhook payload" }, { status: 400 });
        const event = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Apply the shipment update before acknowledging the event. If the
        // database update fails, Velocity can safely retry the same event.
        // Replaying an already-applied update is idempotent.
        const update = {
          status: event.data.status,
          ...(event.data.sub_status !== undefined
            ? { sub_status: event.data.sub_status || null }
            : {}),
          ...(event.data.tracking_number !== undefined
            ? { awb_code: event.data.tracking_number }
            : {}),
          ...(event.data.carrier_name !== undefined
            ? { carrier_name: event.data.carrier_name || null }
            : {}),
          ...(event.data.tracking_url !== undefined
            ? { tracking_url: event.data.tracking_url }
            : {}),
          ...(event.data.estimated_delivery_date !== undefined
            ? { estimated_delivery_date: event.data.estimated_delivery_date }
            : {}),
          ...(event.data.delivered_at !== undefined
            ? { delivered_at: event.data.delivered_at }
            : {}),
          last_error: null,
          last_synced_at: new Date().toISOString(),
        };
        const { data: shipment, error: updateError } = await supabaseAdmin
          .from("order_shipments")
          .update(update)
          .eq("shipment_id", event.data.shipment_id)
          .select("id")
          .maybeSingle();
        if (updateError)
          return Response.json({ message: "Unable to update shipment" }, { status: 500 });
        if (!shipment) {
          // The webhook can arrive immediately after Velocity creates the
          // shipment, before YOMORA has stored the returned shipment ID.
          return Response.json({ message: "Shipment is not ready for update" }, { status: 503 });
        }

        const { error: eventError } = await supabaseAdmin.from("velocity_webhook_events").insert({
          event_id: event.event_id,
          event_type: event.event,
          shipment_id: event.data.shipment_id,
          payload: event,
        });
        if (eventError?.code === "23505") return Response.json({ ok: true, duplicate: true });
        if (eventError)
          return Response.json({ message: "Unable to record webhook" }, { status: 500 });
        return Response.json({ ok: true, duplicate: false });
      },
    },
  },
});

