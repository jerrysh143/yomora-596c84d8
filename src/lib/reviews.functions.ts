import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProductReview = {
  id: string;
  product_id: string;
  order_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  media_urls: string[];
  verified_purchase: boolean;
  created_at: string;
};

const productIdSchema = z.object({
  product_id: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
});

const missingReviewTable = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || error.message?.includes("product_reviews"));

const rowToReview = (row: any): ProductReview => ({
  id: row.id,
  product_id: row.product_id,
  order_id: row.order_id,
  customer_name: row.customer_name,
  rating: Number(row.rating),
  comment: row.comment,
  media_urls: Array.isArray(row.media_urls) ? row.media_urls : [],
  verified_purchase: !!row.verified_purchase,
  created_at: row.created_at,
});

const orderContainsProduct = (items: unknown, productId: string) =>
  Array.isArray(items) && items.some((item) => {
    if (!item || typeof item !== "object") return false;
    return (item as { id?: unknown }).id === productId;
  });

async function authenticatedUser(context: any) {
  const { data, error } = await context.supabase.auth.getUser();
  if (error || !data.user?.email) throw new Error("Unable to identify your account");
  return data.user;
}

export const listProductReviewsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => productIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_reviews")
      .select("id,product_id,order_id,customer_name,rating,comment,media_urls,verified_purchase,created_at")
      .eq("product_id", data.product_id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (missingReviewTable(error)) return [] as ProductReview[];
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToReview);
  });

export const getReviewEligibilityFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => productIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const user = await authenticatedUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = user.email!.trim().toLowerCase();
    const { data: orders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id,items")
      .eq("customer_email", email)
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    if (orderError) throw new Error(orderError.message);

    const order = (orders ?? []).find((candidate) => orderContainsProduct(candidate.items, data.product_id));
    if (!order) {
      return { canReview: false, orderId: null, reason: "Available after this product is delivered." };
    }

    const { data: existing, error: reviewError } = await supabaseAdmin
      .from("product_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("order_id", order.id)
      .eq("product_id", data.product_id)
      .maybeSingle();
    if (missingReviewTable(reviewError)) {
      return { canReview: false, orderId: null, reason: "Reviews are being configured." };
    }
    if (reviewError) throw new Error(reviewError.message);
    if (existing) return { canReview: false, orderId: null, reason: "You already reviewed this purchase." };
    return { canReview: true, orderId: order.id, reason: "" };
  });

const submitReviewSchema = z.object({
  product_id: productIdSchema.shape.product_id,
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
  media_paths: z.array(z.string().min(1).max(500)).max(5).default([]),
});

export const submitProductReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => submitReviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const user = await authenticatedUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id,customer_name,customer_email,status,items")
      .eq("id", data.order_id)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (
      !order ||
      order.status !== "completed" ||
      order.customer_email.trim().toLowerCase() !== user.email!.trim().toLowerCase() ||
      !orderContainsProduct(order.items, data.product_id)
    ) {
      throw new Error("Only delivered purchases can be reviewed");
    }

    const pathPrefix = `${user.id}/`;
    if (data.media_paths.some((path) => !path.startsWith(pathPrefix) || path.includes(".."))) {
      throw new Error("Invalid review media");
    }
    const mediaUrls = data.media_paths.map(
      (path) => supabaseAdmin.storage.from("review-media").getPublicUrl(path).data.publicUrl,
    );
    const metadata = user.user_metadata ?? {};
    const customerName =
      (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
      (typeof metadata.name === "string" && metadata.name.trim()) ||
      order.customer_name.trim() ||
      "YOMORA Customer";

    const { data: review, error } = await supabaseAdmin
      .from("product_reviews")
      .insert({
        product_id: data.product_id,
        order_id: order.id,
        user_id: user.id,
        customer_name: customerName.slice(0, 120),
        rating: data.rating,
        comment: data.comment,
        media_urls: mediaUrls,
        verified_purchase: true,
        is_published: true,
      })
      .select("id,product_id,order_id,customer_name,rating,comment,media_urls,verified_purchase,created_at")
      .single();
    if (error?.code === "23505") throw new Error("You already reviewed this purchase");
    if (missingReviewTable(error)) throw new Error("Reviews are not configured yet");
    if (error) throw new Error(error.message);
    return rowToReview(review);
  });

export const listMyReviewsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const user = await authenticatedUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_reviews")
      .select("id,product_id,order_id,customer_name,rating,comment,media_urls,verified_purchase,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (missingReviewTable(error)) return [] as ProductReview[];
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToReview);
  });
