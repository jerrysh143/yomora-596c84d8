import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createVelocityShipment, trackVelocityShipment, type VelocityActivity } from "@/lib/velocity.server";

type ShippingRow = {
  order_id: string;
  payment_method: "COD" | "PREPAID";
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  sub_status: string | null;
  velocity_order_id: string | null;
  shipment_id: string | null;
  awb_code: string | null;
  carrier_id: string | null;
  carrier_name: string | null;
  tracking_url: string | null;
  label_url: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  tracking_activities: VelocityActivity[];
  last_error: string | null;
  last_synced_at: string | null;
};

function publicShipment(row: ShippingRow) {
  return {
    status: row.status,
    subStatus: row.sub_status,
    awbCode: row.awb_code,
    carrierName: row.carrier_name,
    trackingUrl: row.tracking_url,
    estimatedDeliveryDate: row.estimated_delivery_date,
    deliveredAt: row.delivered_at,
    activities: Array.isArray(row.tracking_activities) ? row.tracking_activities : [],
    lastSyncedAt: row.last_synced_at,
  };
}

async function isAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

function fallbackAddress(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const pincode = parts.at(-1)?.match(/^\d{6}$/)?.[0] || "";
  if (pincode) parts.pop();
  const state = parts.pop() || "";
  const city = parts.pop() || "";
  return { address: parts.join(", ") || value, city, state, pincode };
}

export const createVelocityShipmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await isAdmin(context);
    // Use the authenticated administrator's session for this action. The
    // order_shipments RLS policy independently verifies the admin role.
    const db = context.supabase;
    const [{ data: order, error: orderError }, { data: existing }] = await Promise.all([
      db.from("orders").select("*").eq("id", data.orderId).single(),
      db.from("order_shipments").select("*").eq("order_id", data.orderId).maybeSingle(),
    ]);
    if (orderError || !order) throw new Error(orderError?.message || "Order not found");
    if (existing?.awb_code) return publicShipment(existing as unknown as ShippingRow);

    const parsed = fallbackAddress(order.shipping_address || "");
    const shipping = (existing || {
      order_id: order.id,
      payment_method: /Payment method:\s*cod/i.test(order.notes || "") ? "COD" : "PREPAID",
      address_line: parsed.address,
      city: parsed.city,
      state: parsed.state,
      pincode: parsed.pincode,
    }) as ShippingRow;
    if (shipping.payment_method === "PREPAID") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: payment } = await supabaseAdmin.from("order_payments")
        .select("status")
        .eq("order_id", order.id)
        .maybeSingle();
      if (payment && payment.status !== "completed") {
        throw new Error("PhonePe payment is not completed. Do not create this shipment yet.");
      }
    }
    if (!shipping.city || !shipping.state || !/^\d{6}$/.test(shipping.pincode)) {
      throw new Error("Add a complete city, state and 6-digit pincode before creating the shipment");
    }

    if (!existing) {
      const { error } = await db.from("order_shipments").insert({
        order_id: order.id,
        payment_method: shipping.payment_method,
        address_line: shipping.address_line,
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
      });
      if (error) throw new Error(error.message);
    }

    try {
      const created = await createVelocityShipment({
        externalOrderId: `YOM-${order.id}`,
        orderDate: new Date(order.created_at).toISOString().slice(0, 16).replace("T", " "),
        customerName: order.customer_name,
        address: shipping.address_line,
        city: shipping.city,
        pincode: shipping.pincode,
        state: shipping.state,
        email: order.customer_email,
        phone: order.customer_phone,
        items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
          name: String(item.name || "YOMORA Jewellery"),
          sku: String(item.id || "YOMORA-ITEM"),
          units: Number(item.quantity || 1),
          sellingPrice: Number(item.price || 0),
        })),
        paymentMethod: shipping.payment_method,
        subtotal: Number(order.total),
      });
      const now = new Date().toISOString();
      const { data: saved, error } = await db.from("order_shipments").update({
        status: "ready_to_ship",
        velocity_order_id: created.order_id || null,
        shipment_id: created.shipment_id,
        awb_code: created.awb_code,
        carrier_id: created.courier_company_id || null,
        carrier_name: created.courier_name || null,
        label_url: created.label_url || null,
        last_error: null,
        last_synced_at: now,
      }).eq("order_id", order.id).select("*").single();
      if (error) throw new Error(error.message);
      return publicShipment(saved as unknown as ShippingRow);
    } catch (error) {
      await db.from("order_shipments").update({
        status: "sync_failed",
        last_error: error instanceof Error ? error.message.slice(0, 500) : "Velocity request failed",
        last_synced_at: new Date().toISOString(),
      }).eq("order_id", order.id);
      throw error;
    }
  });

const trackingInput = z.object({
  order_id: z.string().trim().uuid("Enter the complete order ID"),
  customer_email: z.string().trim().email().max(200),
});

export const trackShipmentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const parsed = trackingInput.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(issue?.path[0] === "order_id"
        ? "Please enter the complete Order ID from your confirmation email."
        : "Please enter a valid email address.");
    }
    return parsed.data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("id,status,created_at,updated_at")
      .eq("id", data.order_id)
      .eq("customer_email", data.customer_email.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("No order matches that order ID and email address");
    const { data: shipment } = await supabaseAdmin.from("order_shipments")
      .select("*").eq("order_id", order.id).maybeSingle();
    if (!shipment?.awb_code) return { order, shipment: null };

    try {
      const live = await trackVelocityShipment(shipment.awb_code);
      const now = new Date().toISOString();
      const update = {
        status: live.status,
        carrier_name: live.carrierName || shipment.carrier_name,
        tracking_url: live.trackingUrl || shipment.tracking_url,
        estimated_delivery_date: live.estimatedDeliveryDate,
        delivered_at: live.deliveredAt,
        tracking_activities: live.activities,
        last_error: null,
        last_synced_at: now,
      };
      await supabaseAdmin.from("order_shipments").update(update).eq("order_id", order.id);
      return { order, shipment: publicShipment({ ...shipment, ...update } as ShippingRow) };
    } catch {
      return { order, shipment: publicShipment(shipment as unknown as ShippingRow) };
    }
  });
