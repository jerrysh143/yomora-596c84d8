import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content.defaults";

const SITE_CONTENT_KEYS = new Set(Object.keys(SITE_CONTENT_DEFAULTS));
const URL_FIELDS = new Set(["url", "image_url", "link", "to"]);

function isSafeContentUrl(value: string) {
  if (value === "") return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return /^https:\/\//i.test(value) || /^(mailto|tel):/i.test(value);
}

function validateContentValue(value: unknown, path: string[], depth = 0): string | null {
  if (depth > 8) return `${path.join(".")} is nested too deeply`;
  if (value == null || typeof value === "boolean" || typeof value === "number") return null;
  if (typeof value === "string") {
    if (value.length > 10_000) return `${path.join(".")} is too long`;
    const field = path[path.length - 1];
    if (URL_FIELDS.has(field) && !isSafeContentUrl(value)) return `${path.join(".")} must use HTTPS or a local path`;
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) return `${path.join(".")} has too many items`;
    for (let index = 0; index < value.length; index += 1) {
      const error = validateContentValue(value[index], [...path, String(index)], depth + 1);
      if (error) return error;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) return `${path.join(".")} contains an unsafe field`;
      const error = validateContentValue(child, [...path, key], depth + 1);
      if (error) return error;
    }
    return null;
  }
  return `${path.join(".")} contains an unsupported value`;
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: admin role required");
}

export const getSiteContentFn = createServerFn({ method: "GET" }).handler(async (): Promise<{ key: string; data: any }[]> => {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client.from("site_content").select("key, data");
  if (error) throw new Error(error.message);
  return (data ?? []) as { key: string; data: any }[];
});

export const updateSiteContentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; data: unknown }) => {
    const parsed = z.object({
      key: z.string().min(1).max(64),
      data: z.unknown(),
    }).parse(d);
    if (!SITE_CONTENT_KEYS.has(parsed.key)) throw new Error("Unknown site content section");
    if (JSON.stringify(parsed.data).length > 100_000) throw new Error("Site content section is too large");
    const validationError = validateContentValue(parsed.data, [parsed.key]);
    if (validationError) throw new Error(validationError);
    return parsed;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ key: data.key, data: data.data }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
