import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inquiryInput = z.object({
  inquiry_type: z.enum(["contact", "custom_jewellery", "newsletter"]),
  name: z.string().trim().max(120).default(""),
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Invalid phone number").default(""),
  message: z.string().trim().max(3000).default(""),
}).superRefine((value, ctx) => {
  if (value.inquiry_type !== "newsletter" && value.name.length < 2) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter your name" });
  if (value.inquiry_type !== "newsletter" && value.message.length < 5) ctx.addIssue({ code: "custom", path: ["message"], message: "Enter a little more detail" });
});

async function fingerprint(request: Request, secret: string) {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(address));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const createInquiryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inquiryInput.parse(data))
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { getRequest }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@tanstack/react-start/server"),
    ]);
    const request = getRequest();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!request || !secret) throw new Error("Enquiries are temporarily unavailable");
    const requestFingerprint = await fingerprint(request, secret);
    const { count, error: countError } = await supabaseAdmin.from("customer_inquiries").select("id", { count: "exact", head: true }).eq("request_fingerprint", requestFingerprint).gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= 5) throw new Error("Too many requests. Please try again in a few minutes.");
    if (data.inquiry_type === "newsletter") {
      const { data: existing } = await supabaseAdmin.from("customer_inquiries").select("id").eq("inquiry_type", "newsletter").eq("email", data.email).maybeSingle();
      if (existing) return { ok: true, already: true };
    }
    const { error } = await supabaseAdmin.from("customer_inquiries").insert({ inquiry_type: data.inquiry_type, name: data.name || null, email: data.email, phone: data.phone || null, message: data.message || null, request_fingerprint: requestFingerprint });
    if (error) throw new Error(error.message);
    return { ok: true, already: false };
  });

export const listInquiriesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");
    const { data, error } = await context.supabase.from("customer_inquiries").select("id,inquiry_type,name,email,phone,message,status,created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
