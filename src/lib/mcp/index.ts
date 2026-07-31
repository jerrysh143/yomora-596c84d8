import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listOrders from "./tools/list-orders";
import updateOrderStatus from "./tools/update-order-status";
import setProductAvailability from "./tools/set-product-availability";
import getMyMembership from "./tools/get-my-membership";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "yomora",
  title: "Yomora",
  version: "0.1.0",
  instructions:
    "Tools for the YOMORA silver jewellery store. Browse the catalog with `search_products`, `get_product` and `list_categories`. Signed-in store admins can also review orders with `list_orders`, change them with `update_order_status`, and toggle stock with `set_product_availability`. `get_my_membership` returns the caller's Black Signature membership.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProducts,
    getProduct,
    listCategories,
    listOrders,
    updateOrderStatus,
    setProductAvailability,
    getMyMembership,
  ],
});
