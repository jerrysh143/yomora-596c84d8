const VELOCITY_BASE_URL = "https://shazam.velocity.in/custom/api/v1";

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

export type VelocityActivity = {
  date: string;
  activity: string;
  location: string;
};

export type VelocityTracking = {
  status: string;
  activities: VelocityActivity[];
  trackingUrl: string | null;
  carrierName: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
};

export type VelocityShipmentInput = {
  externalOrderId: string;
  orderDate: string;
  customerName: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  email: string;
  phone: string;
  items: Array<{ name: string; sku: string; units: number; sellingPrice: number }>;
  paymentMethod: "COD" | "PREPAID";
  subtotal: number;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Velocity is not configured: missing ${name}`);
  return value;
}

async function velocityRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (authenticated) headers.set("Authorization", await getVelocityToken());
  const response = await fetch(`${VELOCITY_BASE_URL}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = responseText;
  }
  if (!response.ok) {
    const details: string[] = [];
    const collect = (value: unknown, depth = 0) => {
      if (depth > 3 || details.length >= 8 || value == null) return;
      if (typeof value === "string") {
        const clean = value.replace(/\s+/g, " ").trim();
        if (clean && clean.length <= 500 && !details.includes(clean)) details.push(clean);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => collect(item, depth + 1));
        return;
      }
      if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        let matchedKnownKey = false;
        for (const key of [
          "error",
          "errors",
          "message",
          "messages",
          "detail",
          "details",
          "non_field_errors",
          "payload",
        ]) {
          if (key in record) {
            matchedKnownKey = true;
            collect(record[key], depth + 1);
          }
        }
        // Validation responses may use field names as keys, for example
        // { billing_phone: ["is invalid"] }. Read values only and never echo
        // request fields or credentials back to the admin UI.
        if (!matchedKnownKey) {
          Object.values(record).forEach((item) => collect(item, depth + 1));
        }
      }
    };
    collect(payload);
    const suffix = details.length ? `: ${details.join(", ")}` : "";
    throw new Error(`Velocity request failed (${response.status})${suffix}`);
  }
  return payload as T;
}

export async function getVelocityToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const payload = await velocityRequest<{ token?: string; expires_at?: string }>(
    "/auth-token",
    {
      method: "POST",
      body: JSON.stringify({
        username: requiredEnv("VELOCITY_USERNAME"),
        password: requiredEnv("VELOCITY_PASSWORD"),
      }),
    },
    false,
  );
  if (!payload?.token) throw new Error("Velocity authentication did not return a token");
  const expiry = payload.expires_at
    ? new Date(payload.expires_at).getTime()
    : Date.now() + 23 * 60 * 60 * 1000;
  tokenCache = {
    token: payload.token,
    expiresAt: Number.isFinite(expiry) ? expiry : Date.now() + 23 * 60 * 60 * 1000,
  };
  return payload.token;
}

export async function createVelocityShipment(input: VelocityShipmentInput) {
  const storeName = process.env.VELOCITY_STORE_NAME?.trim();
  const payload = await velocityRequest<{
    status?: number;
    payload?: {
      order_id?: string;
      shipment_id?: string;
      awb_code?: string;
      courier_company_id?: string;
      courier_name?: string;
      label_url?: string;
    };
  }>("/forward-order-orchestration", {
    method: "POST",
    body: JSON.stringify({
      ...(storeName ? { store_name: storeName } : {}),
      order_id: input.externalOrderId,
      order_date: input.orderDate,
      billing_customer_name: input.customerName,
      billing_address: input.address,
      billing_city: input.city,
      billing_pincode: input.pincode,
      billing_state: input.state,
      billing_country: "India",
      billing_email: input.email,
      billing_phone: input.phone,
      shipping_is_billing: true,
      print_label: true,
      order_items: input.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        selling_price: item.sellingPrice,
      })),
      payment_method: input.paymentMethod,
      sub_total: input.subtotal,
      cod_collectible: input.paymentMethod === "COD" ? input.subtotal : 0,
      length: Number(process.env.VELOCITY_PACKAGE_LENGTH_CM || 15),
      breadth: Number(process.env.VELOCITY_PACKAGE_BREADTH_CM || 12),
      height: Number(process.env.VELOCITY_PACKAGE_HEIGHT_CM || 5),
      weight: Number(process.env.VELOCITY_PACKAGE_WEIGHT_KG || 0.3),
      pickup_location: requiredEnv("VELOCITY_PICKUP_LOCATION"),
      warehouse_id: requiredEnv("VELOCITY_WAREHOUSE_ID"),
    }),
  });
  if (!payload?.payload?.shipment_id || !payload.payload.awb_code) {
    throw new Error("Velocity did not return a shipment ID and AWB");
  }
  return payload.payload;
}

export async function trackVelocityShipment(awb: string): Promise<VelocityTracking> {
  const payload = await velocityRequest<any>("/order-tracking", {
    method: "POST",
    body: JSON.stringify({ awbs: [awb] }),
  });
  const trackingData = payload?.result?.[awb]?.tracking_data;
  if (!trackingData) throw new Error("Velocity did not return tracking data for this AWB");
  const shipment = Array.isArray(trackingData.shipment_track)
    ? trackingData.shipment_track[0]
    : null;
  return {
    status: String(trackingData.shipment_status || shipment?.current_status || "unknown"),
    activities: Array.isArray(trackingData.shipment_track_activities)
      ? trackingData.shipment_track_activities.map((activity: any) => ({
          date: String(activity?.date || ""),
          activity: String(activity?.activity || "Update"),
          location: String(activity?.location || ""),
        }))
      : [],
    trackingUrl: typeof trackingData.track_url === "string" ? trackingData.track_url : null,
    carrierName: typeof shipment?.courier_name === "string" ? shipment.courier_name : null,
    estimatedDeliveryDate:
      typeof shipment?.estimated_delivery_date === "string"
        ? shipment.estimated_delivery_date
        : null,
    deliveredAt: typeof shipment?.delivered_date === "string" ? shipment.delivered_date : null,
  };
}
