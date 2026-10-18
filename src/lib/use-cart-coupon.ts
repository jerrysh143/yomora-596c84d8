import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAvailableCouponsFn } from "@/lib/coupons.functions";
import type { CartItem } from "@/lib/cart";

/**
 * Best coupon currently available for the cart, computed by the same Supabase-backed
 * server function checkout uses (prices, minimum order, limits and membership are all
 * checked server-side). Returns null when no coupon applies or the lookup fails.
 * Final validation still happens atomically when the order is created.
 */
export function useCartCoupon(items: CartItem[]) {
  const listAvailableCoupons = useServerFn(listAvailableCouponsFn);
  const couponItems = items.map((item) => ({ id: item.id, quantity: Math.min(10, item.qty) }));
  const query = useQuery({
    queryKey: ["cart", "available-coupons", couponItems],
    queryFn: () => listAvailableCoupons({ data: { items: couponItems } }),
    enabled: couponItems.length > 0 && couponItems.length <= 20,
    staleTime: 60_000,
    retry: false,
  });
  const best = query.data?.[0] ?? null;
  return { coupon: best, isLoading: query.isLoading, isError: query.isError };
}
