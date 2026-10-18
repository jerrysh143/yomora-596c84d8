import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Gift, Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { cart, useCart } from "@/lib/cart";
import { useCartDrawerState } from "@/lib/cart-drawer";
import { useCartCoupon } from "@/lib/use-cart-coupon";
import { formatINR } from "@/lib/products";

export function CartDrawer() {
  const [open, setOpen] = useCartDrawerState();
  const { items, subtotal, count } = useCart();
  const { coupon } = useCartCoupon(open ? items : []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;
  const discount = coupon?.discount ?? 0;

  return (
    <div className="fixed inset-0 z-[120]" role="presentation">
      <button
        type="button"
        aria-label="Close bag"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-onyx/45 backdrop-blur-[2px] animate-in fade-in"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-background text-foreground shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-3xl">Your bag ({count})</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <ShoppingBag className="mx-auto h-8 w-8 text-gold" strokeWidth={1.3} />
              <p className="mt-4 text-sm text-muted-foreground">Your bag is empty.</p>
              <Link
                to="/products"
                className="mt-6 inline-flex h-12 items-center bg-onyx px-7 text-xs font-semibold tracking-[0.12em] text-cream"
              >
                Shop all jewellery
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id + (item.variant ?? "")} className="flex gap-4 border-b border-border px-6 py-5">
                  <div className="img-shimmer h-[88px] w-[88px] shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-lg leading-snug">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => cart.remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">925 sterling silver</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => cart.update(item.id, item.qty - 1)}
                          className="grid h-8 w-8 place-items-center hover:bg-secondary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => cart.update(item.id, item.qty + 1)}
                          className="grid h-8 w-8 place-items-center hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatINR(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-2 bg-secondary/60 px-6 py-4 text-xs text-foreground">
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gold" /> Free shipping across India
                </p>
                <p className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-gold" /> Packed in a premium YOMORA gift box
                </p>
              </div>
            </div>
            <div className="border-t border-border bg-card px-6 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              {coupon && discount > 0 ? (
                <div className="mt-1 flex justify-between text-sm text-emerald-700">
                  <span>Code {coupon.code} (apply at checkout)</span>
                  <span>−{formatINR(discount)}</span>
                </div>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                Coupons are confirmed at checkout. Prices include taxes.
              </p>
              <Link
                to="/checkout"
                className="mt-4 flex h-12 w-full items-center justify-center bg-onyx text-xs font-semibold tracking-[0.14em] text-cream hover:bg-black"
              >
                CHECKOUT SECURELY
              </Link>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/cart"
                  className="flex h-11 items-center justify-center border border-border text-xs font-semibold tracking-[0.1em] hover:border-foreground"
                >
                  VIEW BAG
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 text-xs font-semibold tracking-[0.1em] text-muted-foreground hover:text-foreground"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                UPI · Cash on Delivery, no extra COD fee
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
