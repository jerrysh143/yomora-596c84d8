import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { createOrderFn } from "@/lib/orders.functions";

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
  const createOrder = useServerFn(createOrderFn);
  const [pay, setPay] = useState("upi");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const discount = subtotal >= 1500 ? 210 : 0;
  const total = subtotal - discount;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-x mx-auto max-w-[1400px] py-12">
        <h1 className="font-display text-4xl">Checkout</h1>
        {orderId ? (
          <div className="mt-8 max-w-2xl border border-gold bg-gold/10 p-8">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-gold">ORDER RECEIVED</p>
            <h2 className="mt-2 font-display text-3xl">Thank you for shopping with YOMORA.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your order has been saved and is now visible in YOMORA Admin.
            </p>
            <p className="mt-5 text-sm">
              Order number: <span className="font-mono font-semibold text-gold">{orderId}</span>
            </p>
            <Link to="/products" className="mt-6 inline-block bg-gold px-5 py-3 text-[11px] font-semibold tracking-[0.2em] text-onyx">
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (items.length === 0 || submitting) return;
            const form = new FormData(e.currentTarget);
            setSubmitting(true);
            try {
              const order = await createOrder({
                data: {
                  customer_name: String(form.get("customer_name") ?? ""),
                  customer_email: String(form.get("customer_email") ?? ""),
                  customer_phone: String(form.get("customer_phone") ?? ""),
                  shipping_address: [
                    form.get("address_line"),
                    form.get("city"),
                    form.get("state"),
                    form.get("pincode"),
                  ]
                    .map((value) => String(value ?? "").trim())
                    .filter(Boolean)
                    .join(", "),
                  payment_method: pay as "upi" | "card" | "netbank" | "cod",
                  items: items.map((item) => ({ id: item.id, quantity: item.qty })),
                },
              });
              cart.clear();
              setOrderId(order.id);
              toast.success("Order placed successfully");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to place order");
            } finally {
              setSubmitting(false);
            }
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-8">
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">1. CONTACT INFORMATION</legend>
              <div className="grid gap-4">
                <Input name="customer_email" label="Email" type="email" required placeholder="you@email.com" />
                <Input name="customer_phone" label="Phone" required placeholder="+91 98765 43210" />
              </div>
            </fieldset>
            <fieldset className="border border-border p-6">
              <legend className="px-2 text-xs font-semibold tracking-[0.24em] text-gold">2. SHIPPING ADDRESS</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="customer_name" label="Full name" required />
                <Input name="pincode" label="Pincode" required inputMode="numeric" />
                <Input name="address_line" label="Address line" required className="md:col-span-2" />
                <Input name="city" label="City" required />
                <Input name="state" label="State" required />
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
            <button disabled={items.length === 0 || submitting} className="mt-6 w-full bg-gold py-3 text-[11px] font-semibold tracking-[0.24em] text-onyx disabled:opacity-40">
              {submitting ? "PLACING ORDER…" : "PLACE ORDER"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Your order is saved securely and will appear in YOMORA Admin.</p>
          </aside>
        </form>
        )}
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
