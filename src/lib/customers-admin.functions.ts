import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminCustomer = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  marketing_opt_in: boolean;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  total_purchased: number;
  order_count: number;
  orders: Array<{
    id: string;
    total: number;
    status: "pending" | "completed" | "cancelled";
    created_at: string;
  }>;
};

export const listCustomersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orderRows, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id,customer_email,total,status,created_at")
      .order("created_at", { ascending: false });
    if (ordersError) throw new Error(ordersError.message);
    const ordersByEmail = new Map<string, AdminCustomer["orders"]>();
    for (const order of orderRows ?? []) {
      const email = order.customer_email.trim().toLowerCase();
      const list = ordersByEmail.get(email) ?? [];
      list.push({ id: order.id, total: order.total, status: order.status, created_at: order.created_at });
      ordersByEmail.set(email, list);
    }
    const customers: AdminCustomer[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw new Error(error.message);
      customers.push(...data.users.map((user) => {
        const metadata = user.user_metadata ?? {};
        const email = user.email?.trim().toLowerCase() ?? "";
        const orders = ordersByEmail.get(email) ?? [];
        return {
          id: user.id,
          full_name:
            (typeof metadata.full_name === "string" && metadata.full_name) ||
            (typeof metadata.name === "string" && metadata.name) ||
            "",
          email: user.email ?? "",
          phone: (typeof metadata.phone === "string" && metadata.phone) || user.phone || "",
          marketing_opt_in: metadata.marketing_opt_in === true,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
          total_purchased: orders
            .filter((order) => order.status === "completed")
            .reduce((sum, order) => sum + order.total, 0),
          order_count: orders.length,
          orders,
        };
      }));
      if (data.users.length < 100) break;
    }
    return customers.sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
