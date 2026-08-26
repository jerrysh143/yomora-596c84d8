import { createFileRoute } from "@tanstack/react-router";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_MEDIA_PER_REVIEW = 5;

function json(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ message, ...extra }, { status });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function safeId(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" && value.length <= max && /^[a-z0-9-]+$/.test(value)
    ? value
    : null;
}

function safeUuid(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function orderContainsProduct(items: unknown, productId: string) {
  return Array.isArray(items) && items.some((item) =>
    !!item && typeof item === "object" && (item as { id?: unknown }).id === productId,
  );
}

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const text = String.fromCharCode(...bytes);
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return bytes[0] === 0x89 && text.slice(1, 4) === "PNG";
  if (file.type === "image/webp") return text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP";
  if (file.type === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (file.type === "video/mp4" || file.type === "video/quicktime") return text.slice(4, 8) === "ftyp";
  return false;
}

async function authenticatedUser(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

export const Route = createFileRoute("/api/review-media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticatedUser(request);
        if (!user?.email) return json("Sign in before uploading review media", 401);

        const form = await request.formData().catch(() => null);
        if (!form) return json("Invalid upload", 400);
        const productId = safeId(form.get("product_id"), 80);
        const orderId = safeUuid(form.get("order_id"));
        const file = form.get("file");
        if (!productId || !orderId || !(file instanceof File)) return json("Invalid upload", 400);

        const allowed = IMAGE_TYPES.has(file.type) || VIDEO_TYPES.has(file.type);
        const maxBytes = IMAGE_TYPES.has(file.type) ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
        if (!allowed || file.size < 1 || file.size > maxBytes || !(await hasValidSignature(file))) {
          return json("Unsupported or invalid media file", 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = user.email.trim().toLowerCase();
        const [{ data: order, error: orderError }, { data: existingReview }] = await Promise.all([
          supabaseAdmin
            .from("orders")
            .select("id,customer_email,status,items")
            .eq("id", orderId)
            .maybeSingle(),
          supabaseAdmin
            .from("product_reviews")
            .select("id")
            .eq("order_id", orderId)
            .eq("product_id", productId)
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (orderError || !order || existingReview || order.status !== "completed" ||
          order.customer_email.trim().toLowerCase() !== email || !orderContainsProduct(order.items, productId)) {
          return json("Only delivered purchases can upload review media", 403);
        }

        const prefix = `${user.id}/${orderId}/${productId}`;
        const { data: existingFiles, error: listError } = await supabaseAdmin.storage
          .from("review-media")
          .list(prefix, { limit: MAX_MEDIA_PER_REVIEW + 1 });
        if (listError) return json("Unable to prepare upload", 500);
        if ((existingFiles?.length ?? 0) >= MAX_MEDIA_PER_REVIEW) {
          return json("Upload up to 5 files per review", 409);
        }

        const extension = file.type === "image/jpeg" ? "jpg"
          : file.type === "image/png" ? "png"
          : file.type === "image/webp" ? "webp"
          : file.type === "video/webm" ? "webm"
          : file.type === "video/quicktime" ? "mov" : "mp4";
        const path = `${prefix}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabaseAdmin.storage.from("review-media").upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        if (uploadError) return json("Unable to upload media", 500);
        return json("Uploaded", 201, { path });
      },

      DELETE: async ({ request }) => {
        const user = await authenticatedUser(request);
        if (!user) return json("Unauthorized", 401);
        const body = await request.json().catch(() => null) as { paths?: unknown } | null;
        const paths = Array.isArray(body?.paths)
          ? body.paths.filter((path): path is string => typeof path === "string" && path.startsWith(`${user.id}/`) && !path.includes(".."))
          : [];
        if (!paths.length || paths.length > MAX_MEDIA_PER_REVIEW) return json("Invalid paths", 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.storage.from("review-media").remove(paths);
        if (error) return json("Unable to remove media", 500);
        return json("Removed", 200);
      },
    },
  },
});
