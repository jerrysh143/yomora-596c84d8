import { createFileRoute } from "@tanstack/react-router";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function json(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ message, ...extra }, { status });
}

export const Route = createFileRoute("/api/payment-proof")({
  server: { handlers: { POST: async ({ request }) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json("Sign in before uploading payment proof", 401);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: auth } = await supabaseAdmin.auth.getUser(token);
    if (!auth.user?.email) return json("Invalid session", 401);
    const form = await request.formData().catch(() => null);
    const orderId = String(form?.get("order_id") ?? "");
    const file = form?.get("file");
    if (!/^[0-9a-f-]{36}$/i.test(orderId) || !(file instanceof File) || !IMAGE_TYPES.has(file.type) || file.size < 1 || file.size > MAX_BYTES) {
      return json("Choose a JPG, PNG, or WebP payment screenshot up to 5 MB", 400);
    }
    const { data: order } = await supabaseAdmin.from("orders").select("id,customer_email").eq("id", orderId).maybeSingle();
    if (!order || order.customer_email.trim().toLowerCase() !== auth.user.email.trim().toLowerCase()) return json("Order not found", 404);

    const storageRoot = process.env.MEDIA_STORAGE_ROOT?.trim();
    const publicBase = process.env.MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
    if (!storageRoot || !publicBase || !/^https:\/\//i.test(publicBase)) return json("Payment proof storage is not configured", 503);
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const relativePath = `payment-proofs/${orderId}/${crypto.randomUUID()}.${extension}`;
    const [{ mkdir, writeFile }, pathModule] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    const root = pathModule.resolve(storageRoot);
    const target = pathModule.resolve(root, relativePath);
    if (!target.startsWith(`${root}${pathModule.sep}`)) return json("Invalid upload path", 400);
    await mkdir(pathModule.dirname(target), { recursive: true });
    await writeFile(target, new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
    return json("Payment proof uploaded", 201, { url: `${publicBase}/${relativePath}` });
  } } },
});
