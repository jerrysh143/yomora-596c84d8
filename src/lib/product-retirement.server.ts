import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RETIREMENT_KEY = "product_retirement_schedule";
const RETIREMENT_DAYS = 7;

type RetirementEntry = {
  productId: string;
  deleteAt: string;
};

function retirementEntries(value: unknown): RetirementEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is RetirementEntry =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as RetirementEntry).productId === "string" &&
      typeof (entry as RetirementEntry).deleteAt === "string",
  );
}

async function readSchedule() {
  const { data, error } = await supabaseAdmin
    .from("site_content")
    .select("data")
    .eq("key", RETIREMENT_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return retirementEntries(data?.data);
}

async function writeSchedule(entries: RetirementEntry[]) {
  const { error } = await supabaseAdmin
    .from("site_content")
    .upsert({ key: RETIREMENT_KEY, data: entries }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function scheduleProductsForRetirement(productIds: string[]) {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (!uniqueIds.length) return 0;

  const { data: products, error: productError } = await supabaseAdmin
    .from("products")
    .update({ sold_out: true })
    .in("id", uniqueIds)
    .select("id");
  if (productError) throw new Error(productError.message);

  const scheduledIds = new Set((products ?? []).map((product) => product.id));
  const existing = await readSchedule();
  const deleteAt = new Date(Date.now() + RETIREMENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const next = existing.filter((entry) => !scheduledIds.has(entry.productId));
  for (const productId of scheduledIds) next.push({ productId, deleteAt });
  await writeSchedule(next);

  return scheduledIds.size;
}

export async function deleteExpiredRetiredProducts() {
  const schedule = await readSchedule();
  if (!schedule.length) return 0;

  const now = Date.now();
  const expired = schedule.filter((entry) => Date.parse(entry.deleteAt) <= now);
  if (!expired.length) return 0;

  const expiredIds = expired.map((entry) => entry.productId);
  const { data: soldProducts, error: lookupError } = await supabaseAdmin
    .from("products")
    .select("id")
    .in("id", expiredIds)
    .eq("sold_out", true);
  if (lookupError) throw new Error(lookupError.message);

  const deleteIds = (soldProducts ?? []).map((product) => product.id);
  if (deleteIds.length) {
    const [wishlistResult, notifyResult] = await Promise.all([
      supabaseAdmin.from("wishlist_items").delete().in("product_id", deleteIds),
      supabaseAdmin.from("product_notify_requests").delete().in("product_id", deleteIds),
    ]);
    if (wishlistResult.error) throw new Error(wishlistResult.error.message);
    if (notifyResult.error) throw new Error(notifyResult.error.message);

    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .in("id", deleteIds)
      .eq("sold_out", true);
    if (deleteError) throw new Error(deleteError.message);
  }

  const expiredSet = new Set(expiredIds);
  await writeSchedule(schedule.filter((entry) => !expiredSet.has(entry.productId)));
  return deleteIds.length;
}

export { RETIREMENT_DAYS };
