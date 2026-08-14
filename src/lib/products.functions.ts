import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Product, Category, Audience } from "./products";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const mapRow = (r: any): Product => ({
  id: r.id,
  name: r.name,
  price: r.price,
  category: r.category as Category,
  audience: (r.audience ?? "unisex") as Audience,
  tagline: r.tagline ?? "",
  description: r.description ?? "",
  image_url: r.image_url,
  gallery_urls: Array.isArray(r.gallery_urls) ? r.gallery_urls : [],
  is_new: !!r.is_new,
  sold_out: !!r.sold_out,
  created_at: r.created_at ?? null,
});

export const listProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublicClient();
  const { data, error } = await sb
    .from("products")
    .select("id,name,price,category,audience,tagline,description,image_url,gallery_urls,is_new,sold_out,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
});

export const getProductFn = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: row, error } = await sb
      .from("products")
      .select("id,name,price,category,audience,tagline,description,image_url,gallery_urls,is_new,sold_out,created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapRow(row) : null;
  });

const productInput = z.object({
  id: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
  name: z.string().min(1).max(120),
  price: z.number().int().min(0).max(10_000_000),
  category: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Invalid category slug"),
  audience: z.enum(["men", "women", "kids", "unisex"]).default("unisex"),
  tagline: z.string().max(200).default(""),
  description: z.string().max(4000).default(""),
  image_url: z
    .string()
    .max(1000)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Invalid image URL")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  gallery_urls: z
    .array(
      z
        .string()
        .max(1000)
        .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Invalid image URL"),
    )
    .max(12)
    .default([]),
  is_new: z.boolean().default(false),
  sold_out: z.boolean().default(false),
});

export const upsertProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin role required");
    const { error } = await context.supabase.from("products").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const productImagesInput = z.object({
  id: z.string().min(1).max(80),
  image_url: z
    .string()
    .max(1000)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Invalid image URL")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  gallery_urls: z
    .array(
      z
        .string()
        .max(1000)
        .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Invalid image URL"),
    )
    .max(12),
});

/** Update only product image fields after the admin batch optimizer succeeds. */
export const updateProductImagesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productImagesInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { id, ...images } = data;
    const { error } = await context.supabase.from("products").update(images).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });
