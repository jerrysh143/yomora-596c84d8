import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_order_status",
  title: "Update order status",
  description: "Change the status of a YOMORA order. Requires a store admin account.",
  inputSchema: {
    id: z.string().uuid().describe("Order id."),
    status: z.enum(["pending", "completed", "cancelled"]).describe("New order status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id,status")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Order not updated — it may not exist or your account is not a store admin.");
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { order: data } };
  },
});
