import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search the YOMORA jewellery catalog by name, category slug, or audience (men/women/kids).",
  inputSchema: {
    query: z.string().trim().optional().describe("Text to match against product name or tagline."),
    category: z.string().trim().optional().describe("Category slug, e.g. 'rings'."),
    audience: z.enum(["men", "women", "kids", "all"]).optional().describe("Target audience filter."),
    in_stock_only: z.boolean().optional().describe("Only return products that are not sold out."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, audience, in_stock_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    let q = supabaseForUser(ctx)
      .from("products")
      .select("id,name,tagline,price,category,audience,sold_out,is_new,image_url")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (query) q = q.or(`name.ilike.%${query}%,tagline.ilike.%${query}%`);
    if (category) q = q.eq("category", category);
    if (audience) q = q.eq("audience", audience);
    if (in_stock_only) q = q.eq("sold_out", false);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
