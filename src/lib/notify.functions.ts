import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const notifyInput = z
  .object({
    product_id: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Invalid product"),
    name: z.string().max(120).default(""),
    email: z.string().max(200).email().or(z.literal("")).default(""),
    phone: z
      .string()
      .max(30)
      .regex(/^[0-9+()\-\s]*$/, "Invalid phone")
      .default(""),
  })
  .transform((v) => ({
    product_id: v.product_id,
    name: v.name.trim(),
    email: v.email.trim().toLowerCase(),
    phone: v.phone.trim(),
  }))
  .refine((v) => v.email !== "" || v.phone !== "", "Enter an email or phone number");

function getClientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function createRequestFingerprint(request: Request, secret: string): Promise<string> {
  const address = getClientAddress(request);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(address));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export const createNotifyRequestFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => notifyInput.parse(d))
  .handler(async ({ data }) => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error("Restock notifications are not configured");

    const [{ supabaseAdmin }, { getRequest }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    if (!request) throw new Error("Invalid request");

    const fingerprint = await createRequestFingerprint(request, serviceRoleKey);
    const { error } = await supabaseAdmin.rpc("create_product_notify_request", {
      _product_id: data.product_id,
      _name: data.name,
      _email: data.email,
      _phone: data.phone,
      _request_fingerprint: fingerprint,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listNotifyRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");
    const { data, error } = await context.supabase
      .from("product_notify_requests")
      .select("id,product_id,name,email,phone,notified,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
