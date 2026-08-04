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
    const customers: AdminCustomer[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw new Error(error.message);
      customers.push(...data.users.map((user) => {
        const metadata = user.user_metadata ?? {};
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
        };
      }));
      if (data.users.length < 100) break;
    }
    return customers.sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
