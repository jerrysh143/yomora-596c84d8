import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — YOMORA" },
      { name: "description", content: "Complete your YOMORA order — secure checkout." },
      { property: "og:title", content: "Checkout — YOMORA" },
      { property: "og:description", content: "Secure checkout." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const nav = useNavigate();
  const [pay, setPay] = useState("upi");
  const discount = subtotal >= 1500 ? 210 : 0;
  const total = subtotal - discount;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-12">
        <h1 className="font-display text-4xl">Checkout</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = "YOM" + Math.floor(1000 + Math.random() * 9000);
            cart.clear();
            nav({ to: "/track-order", hash: id });
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-8">
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">1. CONTACT INFORMATION</legend>
              <div className="grid gap-4">
                <Input label="Email" type="email" required placeholder="you@email.com" />
                <Input label="Phone" required placeholder="+91 98765 43210" />
              </div>
            </fieldset>
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">2. SHIPPING ADDRESS</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Full name" required />
                <Input label="Pincode" required />
                <Input label="Address line" required className="md:col-span-2" />
                <Input label="City" required />
                <Input label="State" required />
              </div>
            </fieldset>
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">3. PAYMENT METHOD</legend>
              <div className="space-y-3 text-sm">
                {[
                  ["upi", "UPI / Google Pay / PhonePe"],
                  ["card", "Credit / Debit Card"],
                  ["netbank", "Net Banking"],
                  ["cod", "Cash on Delivery"],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-3 border border-border px-4 py-3">
                    <input type="radio" name="pay" value={v} checked={pay === v} onChange={() => setPay(v)} />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <aside className="border border-border p-6 h-max">
            <h2 className="text-xs font-semibold tracking-[0.28em] text-gold">ORDER SUMMARY</h2>
            <div className="mt-4 space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <img src={i.image} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="font-display">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.qty}</div>
                  </div>
                  <div className="text-sm">{formatINR(i.price * i.qty)}</div>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">No items in cart. <Link to="/products" className="text-gold">Shop now</Link></p>}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Row k="Subtotal" v={formatINR(subtotal)} />
              {discount > 0 && <Row k="Discount" v={`-${formatINR(discount)}`} />}
              <Row k="Shipping" v="FREE" />
              <div className="my-3 h-px bg-border" />
              <Row k="Total" v={formatINR(total)} bold />
            </dl>
            <button disabled={items.length === 0} className="mt-6 w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-40">PLACE ORDER</button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">100% Secure Payment</p>
          </aside>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function Input({ label, className = "", ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</span>
      <input {...rest} className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
    </label>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}><dt>{k}</dt><dd>{v}</dd></div>;
}