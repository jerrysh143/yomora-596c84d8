import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "set_product_availability",
  title: "Set product availability",
  description: "Mark a YOMORA product as sold out or back in stock. Requires a store admin account.",
  inputSchema: {
    id: z.string().trim().min(1).describe("Product id."),
    sold_out: z.boolean().describe("True to mark sold out, false to mark available."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, sold_out }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .update({ sold_out })
      .eq("id", id)
      .select("id,name,sold_out")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Product not updated — it may not exist or your account is not a store admin.");
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { product: data } };
  },
});
