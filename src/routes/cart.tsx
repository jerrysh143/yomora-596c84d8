import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — YOMORA" },
      { name: "description", content: "Review the pieces in your YOMORA cart." },
      { property: "og:title", content: "Your Cart — YOMORA" },
      { property: "og:description", content: "Review your selection." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, count } = useCart();
  const shipping = 0;
  const discount = subtotal >= 1500 ? 210 : 0;
  const total = subtotal + shipping - discount;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-12">
        <h1 className="font-display text-4xl">Your Cart <span className="text-muted-foreground text-lg">({count} items)</span></h1>

        {items.length === 0 ? (
          <div className="mt-16 border border-border py-24 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Link to="/products" className="mt-6 inline-block bg-onyx px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-cream">CONTINUE SHOPPING</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="border border-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
                <span>PRODUCT</span><span>PRICE</span><span>QUANTITY</span><span>TOTAL</span>
              </div>
              {items.map((i) => (
                <div key={i.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={i.image} alt={i.name} width={64} height={64} loading="lazy" decoding="async" className="h-16 w-16 object-cover" />
                    <div>
                      <div className="font-display text-base">{i.name}</div>
                      {i.variant && <div className="text-xs text-muted-foreground">{i.variant}</div>}
                    </div>
                  </div>
                  <div className="text-sm">{formatINR(i.price)}</div>
                  <div className="inline-flex items-center border border-border">
                    <button onClick={() => cart.update(i.id, i.qty - 1)} className="p-2 hover:text-gold"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="min-w-6 text-center text-sm">{i.qty}</span>
                    <button onClick={() => cart.update(i.id, i.qty + 1)} className="p-2 hover:text-gold"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {formatINR(i.price * i.qty)}
                    <button onClick={() => cart.remove(i.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <div className="px-5 py-4">
                <Link to="/products" className="text-xs tracking-[0.2em] text-muted-foreground hover:text-gold">← CONTINUE SHOPPING</Link>
              </div>
            </div>
            <aside className="border border-border p-6">
              <h2 className="text-xs font-semibold tracking-[0.28em] text-gold">CART SUMMARY</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <Row k="Subtotal" v={formatINR(subtotal)} />
                <Row k="Shipping" v="FREE" />
                {discount > 0 && <Row k="Discount (WELCOME10)" v={`-${formatINR(discount)}`} />}
                <div className="my-3 h-px bg-border" />
                <Row k="Total" v={formatINR(total)} bold />
              </dl>
              <Link to="/checkout" className="mt-6 block bg-gold py-3 text-center text-[11px] font-semibold tracking-[0.24em] text-onyx">PROCEED TO CHECKOUT</Link>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">100% Secure Payment</p>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <dt>{k}</dt><dd>{v}</dd>
    </div>
  );
}